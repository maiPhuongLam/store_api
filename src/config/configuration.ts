export default () => ({
  port: parseInt(process.env.PORT, 10),
  mongodbUrl: process.env.DB_URL,
  adminSecretToken: process.env.ADMIN_SECRET_TOKEN,
  passEmailGoogle: process.env.PASS_EMAIL_GOOGLE,
  jwtSecretToken: process.env.JWT_SECRET_TOKEN,
  appPrefix: process.env.APP_PREFIX,
  fileStoragePath: process.env.FILE_STORAGE_PATH,
  cloundinary: {
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
    folderPath: process.env.FOLDER_PATH,
    publicId_prefix: process.env.PUBLIC_ID_PREFIX,
    bigSize: '400x400',
  },
  stripe: {
    public_key: process.env.PUBLIC_KEY,
    secret_key: process.env.SECRET_KEY,
    successUrl: process.env.SUCCESS_URL,
    cancelUrl: process.env.CANCEL_URL,
    webhook_secret: process.env.WEBHOOK_SECRET,
  },
});
