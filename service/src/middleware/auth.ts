import { isNotEmptyString } from '../utils/is'
import fetch from 'node-fetch'

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
      const token  = Authorization.replace('Bearer ', '').trim()
      if (isNotEmptyString(chat_lm_uri)){
        const response = await fetch(`${chat_lm_uri}/activate/${token}`, { headers }).catch((err) => { throw new Error(`网络错误 | Network error: ${err.message}`) })
        if (response.status !== 200) {
          throw new Error(`请求许可证失败 | Failed to request license: ${response.statusText}`)
        }
        else {
          const data = await response.json()

          const updatedAt = new Date(data.data.updatedAt)
          const today = new Date()
          const days = data.data.validFor
          const updatedAtPlusDays = new Date(updatedAt.getTime() + (days * 24 * 60 * 60 * 1000))
          if (updatedAtPlusDays < today)
            throw new Error('密钥过期，请申请新的授权码 | "Expired key')
          
          if (data.data.timesActivated > data.data.timesActivatedMax)
            throw new Error('可用token为0，请申请新的授权码 | "usage: 0 tokens ')
        }      
      }

      if (!Authorization)// || Authorization.replace('Bearer ', '').trim() !== authStore.token.trim())
        throw new Error('Error: 无访问权限 | No access rights')
        // todo 判断可用次数
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
