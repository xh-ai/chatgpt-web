import fetch from 'node-fetch'
import { isNotEmptyString } from '../utils/is'

const auth = async (req, res, next) => {
  const AUTH_SECRET_KEY = process.env.AUTH_SECRET_KEY
  const chat_lm_uri = process.env.CHAT_LM_URI || ''
  // 将用户名和密码编码为Base64字符串
  const auth_code = Buffer.from('ck_19465cb4cb67a9649058b60d7e78168059bcd818:cs_f20060b646e2ce1dc395d60290bb2a874cd6993b').toString('base64')
  // 添加Basic Auth认证信息
  const headers = {
    Authorization: `Basic ${auth_code}`,
  }

  if (isNotEmptyString(AUTH_SECRET_KEY)) {
    try {
      const Authorization = req.header('Authorization')
      const token = Authorization.replace('Bearer ', '').trim()
      if (isNotEmptyString(chat_lm_uri)) {
        const response = await fetch(`${chat_lm_uri}/activate/${token}`, { headers }).catch((err) => { throw new Error(`网络错误 | Network error: ${err.message}`) })
        const data = await response.json()
        if (response.status !== 200) {
          throw new Error(`请求许可证失败 | ${data.message}`)
        }
        else {
          const expires_at = data.data.expires_at
          const today = new Date()
          if (expires_at < today)
            throw new Error('密钥过期 | "Expired key')
        }
      }

      if (!Authorization)// || Authorization.replace('Bearer ', '').trim() !== authStore.token.trim())
        throw new Error('Error: 无访问权限 | No access rights')
      next()
    }
    catch (error) {
      res.send({ status: 'Unauthorized', message: error.message ?? 'Please authenticate.', data: null })
    }
  }
  else {
    next()
  }
}

export { auth }
