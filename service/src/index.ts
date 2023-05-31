import fetch from 'node-fetch'
import express from 'express'
import type { RequestProps } from './types'
import type { ChatMessage } from './chatgpt'
import { chatConfig, chatReplyProcess, currentModel } from './chatgpt'
import { auth } from './middleware/auth'
import { limiter } from './middleware/limiter'
import { isNotEmptyString } from './utils/is'

const app = express()
const router = express.Router()

app.use(express.static('public'))
app.use(express.json())

app.all('*', (_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'authorization, Content-Type')
  res.header('Access-Control-Allow-Methods', '*')
  next()
})

router.post('/chat-process', [auth, limiter], async (req, res) => {
  res.setHeader('Content-type', 'application/octet-stream')

  try {
    const { prompt, options = {}, systemMessage, temperature, top_p } = req.body as RequestProps
    let firstChunk = true
    await chatReplyProcess({
      message: prompt,
      lastContext: options,
      process: (chat: ChatMessage) => {
        res.write(firstChunk ? JSON.stringify(chat) : `\n${JSON.stringify(chat)}`)
        firstChunk = false
      },
      systemMessage,
      temperature,
      top_p,
    })
  }
  catch (error) {
    res.write(JSON.stringify(error))
  }
  finally {
    res.end()
  }
})

router.post('/config', auth, async (req, res) => {
  try {
    const response = await chatConfig()
    res.send(response)
  }
  catch (error) {
    res.send(error)
  }
})

router.post('/session', async (req, res) => {
  try {
    const AUTH_SECRET_KEY = process.env.AUTH_SECRET_KEY
    const hasAuth = isNotEmptyString(AUTH_SECRET_KEY)
    res.send({ status: 'Success', message: '', data: { auth: hasAuth, model: currentModel() } })
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})

// 将用户名和密码编码为Base64字符串
const auth_code = Buffer.from('ck_19465cb4cb67a9649058b60d7e78168059bcd818:cs_f20060b646e2ce1dc395d60290bb2a874cd6993b').toString('base64')
// 添加Basic Auth认证信息
const headers = {
  Authorization: `Basic ${auth_code}`,
}

router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body as { token: string }
    if (!token)
      throw new Error('密钥为空 | Secret key is empty')

    // Validate token with API
    // 读取环境变量 licenses manager CHAT_LM_URI
    const chat_lm_uri = process.env.CHAT_LM_URI || ''

    if (!isNotEmptyString(chat_lm_uri)) {
      if (process.env.AUTH_SECRET_KEY !== token)
        throw new Error('密钥无效 | Secret key is invalid')

      res.send({ status: 'Success', message: 'Verify successfully', data: null })
    }

    // ‘http://ai4all.me/wp-json/lmfwc/v2/licenses/’
    const response = await fetch(`${chat_lm_uri}/activate/${token}`, { headers }).catch((err) => { throw new Error(`网络错误 | Network error: ${err.message}`) })
    const data = await response.json()
    if (response.status !== 200) {
      throw new Error(`请求许可证失败 | ${data.message}`)
    }
    else {
      // 判断授权码是否激活
      const createdAt = new Date(data.data.createdAt)
      const today = new Date()
      const days = data.data.validFor

      // 第一次访问设置过期时间
      if (data.data.timesActivated < 1) {
        const expires_at = new Date(createdAt.getTime() + (days * 24 * 60 * 60 * 1000))
        const year = expires_at.getFullYear()
        const month = String(expires_at.getMonth() + 1).padStart(2, '0')
        const day = String(expires_at.getDate()).padStart(2, '0')
        const formatted_date = `${year}-${month}-${day}`
        const mydata = { expires_at: formatted_date, validFor: null }

        const response = await fetch(`${chat_lm_uri}/${token}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(mydata),
        }).catch((err) => {
          throw new Error(`网络错误 | Network error: ${err.message}`)
        })
      }

      const expires_at = data.data.expires_at

      if (expires_at < today)
        throw new Error('密钥过期 | "Expired key')

      if (!data.success || !data.data || data.data.licenseKey !== token)
        throw new Error('密钥无效 | Secret key is invalid')
    }

    res.send({ status: 'Success', message: '验证成功 | Verify successfully', data: null })
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})

// router.post('/verify', async (req, res) => {
//   try {
//     const { token } = req.body as { token: string }
//     if (!token)
//       throw new Error('Secret key is empty')

//     if (process.env.AUTH_SECRET_KEY !== token)
//       throw new Error('密钥无效 | Secret key is invalid')

//     res.send({ status: 'Success', message: 'Verify successfully', data: null })
//   }
//   catch (error) {
//     res.send({ status: 'Fail', message: error.message, data: null })
//   }
// })

app.use('', router)
app.use('/api', router)
app.set('trust proxy', 1)

app.listen(3002, () => globalThis.console.log('Server is running on port 3002'))
