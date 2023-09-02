import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();


if (!process.env.DIFY_API_URL) 
  throw new Error('DIFY API URL is required.');


const app = express();
app.use(bodyParser.json());


app.all('/*', (req, res, next) => {
    console.log(`--- ${new Date()} ---`);
    console.log(`[Request Body] ${JSON.stringify(req.body || {})}`);
    console.log(`[Request Header] ${JSON.stringify(req.headers)}`);
    console.log(`[Request Method] ${req.method}`);
    next();
})


app.post('/v1/chat/completions', async (req, res) => {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const jsonFunc = res.json;
    res.json = (d) => {
        console.log(`[Return Json] ${JSON.stringify(d)}`);
        jsonFunc(d);
    }
    if (!authHeader) {
        return res.status(401).json({
            code: 401,
            errmsg: 'Unauthorized.'
        })
    }
    else
    {
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                code: 401,
                errmsg: 'Unauthorized.'
            })
        }
    }
    try {
        // 由于dify采用conversation_id模式
        // 暂不支持连续对话 直接提取最后一句
        const data = req.body;
        const queryString = data.messages[data.messages.length-1].content;
        // const response = axios({
        //     method: 'POST',
        //     url: process.env.DIFY_API_URL + '/chat-messages',
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'Authorization': `Bearer ${authHeader.split(' ')[1]}`
        //     },
        //     data: {
        //         'inputs': {},
        //         'query': queryString,
        //         'response_mode': 'streaming',
        //         'conversation_id': '',
        //         'user': 'apiuser'
        //     },
        //     responseType: 'stream',
        //     decompress: false
        // });
        const response = await fetch(process.env.DIFY_API_URL + '/chat-messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authHeader.split(' ')[1]}`
            },
            data: {
                'inputs': {},
                'query': queryString,
                'response_mode': 'streaming',
                'conversation_id': '',
                'user': 'apiuser'
            }
        });
        console.log('Start streaming...');
        response.body.pipeTo(res);
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            code: 500,
            errmsg: 'Internal Server Error.'
        })
    }

})


app.listen(process.env.PORT || 3000);