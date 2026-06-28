export const generarTokenPassword = function() {
  const token = this.createToken()
  this.resetToken = token
  this.resetTokenExpire = Date.now() + 1000 * 60 * 15
  return token
}