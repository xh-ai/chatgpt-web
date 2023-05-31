import { isNotEmptyString } from '../utils/is'
import fetch from 'node-fetch'

const auth = async (req, res, next) => {
  const AUTH_SECRET_KEY = process.env.AUTH_SECRET_KEY
  const chat_lm_uri = process.env.CHAT_LM_URI || ''

  if (isNotEmptyString(AUTH_SECRET_KEY)) {
    try {
      
      const Authorization = req.header('Authorization')
      const token  = Authorization.replace('Bearer ', '').trim()
      if (isNotEmptyString(chat_lm_uri)){
        const response = await fetch(`${chat_lm_uri}/${token}`, { headers }).catch((err) => { throw new Error(`网络错误 | Network error: ${err.message}`) })
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
            throw new Error('密钥过期 | "Expired key')
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
