export default generateAgoraToken = (
    UID = undefined,
    channelName = "",
    tokenExpirationInSecond = 600,
    privilegeExpirationInSecond = 360
) => {
    // Get the value of the environment variable AGORA_APP_ID. Make sure you set this variable to the App ID you obtained from Agora console.
  const appId = process.env.AGORA_APP_ID;
  // Get the value of the environment variable AGORA_APP_CERTIFICATE. Make sure you set this variable to the App certificate you obtained from Agora console
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  // Replace channelName with the name of the channel you want to join
  const channelName = channelName || "channelName";
  // Fill in your actual user ID
  const uid = UID || 2882341273;
  // Set streaming permissions
  const role = RtcRole.PUBLISHER;
  
  if (appId == undefined || appId == "" || appCertificate == undefined || appCertificate == "") {
    console.log("Need to set environment variable AGORA_APP_ID and AGORA_APP_CERTIFICATE");
    throw new Error('App id is not found!')
  }
  
  // Generate Token
  const tokenWithUid = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, role, tokenExpirationInSecond, privilegeExpirationInSecond);

  return { token: tokenWithUid, uid, channelName, tokenExpirationInSecond }
}