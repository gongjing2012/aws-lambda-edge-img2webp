const path = require('path')
const AWS = require('aws-sdk')

const S3 = new AWS.S3({
  signatureVersion: 'v4',
  region: 'us-east-1'
})

const Sharp = require('sharp')
const BUCKET = 'aws-lambda-edge-image2webp'
const QUALITY = 70

exports.handler = async (event, context, callback) => {
  
  // log for debug
  // console.info("ENVIRONMENT VARIABLES\n" + JSON.stringify(process.env, null, 2))
  // console.info("EVENT\n" + JSON.stringify(event, null, 2))

  const { request, response } = event.Records[0].cf
  const { uri } = request
  const headers = response.headers

  if (path.extname(uri) === '.webp') {
    // if s3 bucket is private, it will return 403
    if (response.status === "404" || response.status === "403") {
      const format = request.headers['original-resource-type'] && request.headers['original-resource-type'][0]
        ? request.headers['original-resource-type'][0].value.replace('image/', '')
        : null

      const key = uri.substring(1)
      const s3key = key.replace('.webp', `.${format}`)
      console.error("-------s3key-----------",s3key)
      try {
        const bucketResource = await S3.getObject({ Bucket: BUCKET, Key: s3key }).promise()
        const sharpImageBuffer = await Sharp(bucketResource.Body)
          .webp({ quality: +QUALITY })
          .toBuffer()

        await S3.putObject({
          Body: sharpImageBuffer,
          Bucket: BUCKET,
          ContentType: 'image/webp',
          CacheControl: 'max-age=31536000',
          Key: key,
          StorageClass: 'STANDARD',
          ACL: 'public-read'
        }).promise()

        response.status = 200
        response.body = sharpImageBuffer.toString('base64')
        response.bodyEncoding = 'base64'
        response.headers['content-type'] = [{ key: 'Content-Type', value: 'image/webp' }]
      } catch (error) {
        console.error(error)
      }
    } else {
      headers['content-type'] = [{
        'value': 'image/webp',
        'key': 'Content-Type'
      }]
    }
  }

  // log for debug
  // console.info("RESPONSE\n" + JSON.stringify(response, null, 2))

  callback(null, response)
 }