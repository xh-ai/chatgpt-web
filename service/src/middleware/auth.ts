import { isNotEmptyString } from '../utils/is'

const auth = async (req, res, next) => {
  const AUTH_SECRET_KEY = req.session.auth_secret_key
  if (isNotEmptyString(AUTH_SECRET_KEY)) {
    try {
      const Authorization = req.header('Authorization')
      if (!Authorization || Authorization.replace('Bearer ', '').trim() !== AUTH_SECRET_KEY.trim())
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


router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body as { token: string }
    if (!token)
      throw new Error('密钥为空 | Secret key is empty')


    // Validate token with API
    const response = await fetch(`https://ai4all.me/wp-json/lmfwc/v2/licenses/${token}`, { headers }).catch(err => { throw new Error(`网络错误 | Network error: ${err.message}`)});
    if (response.status !== 200)
      throw new Error(`请求许可证失败 | Failed to request license: ${response.statusText}`);
    
    const data = await response.json();
    if (!data.success || !data.data || data.data.licenseKey !== token) {
      throw new Error('密钥无效 | Secret key is invalid');
    }

    res.send({ status: 'Success', message: '验证成功 | Verify successfully', data: null })
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})
