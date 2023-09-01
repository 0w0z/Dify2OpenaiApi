import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();


if (!process.env.DIFY_API_URL) 
  throw new Error('DIFY API URL is required.');


const app = express();
app.use(bodyParser.json());


app.post('/v1/chat/completions', async (req, res) => {
    const authHeader = req.headers['Authorization'];
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
        const response = await axios({
            method: 'POST',
            url: process.env.DIFY_API_URL + '/chat-messages',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            data: {
                'inputs': {},
                'query': queryString,
                'response_mode': 'streaming',
                'conversation_id': '',
                'user': 'apiuser'
            }
        });
        response.data.pipe(res);
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            code: 500,
            errmsg: 'Internal Server Error.'
        })
    }

})


app.listen(process.env.PORT || 3000);