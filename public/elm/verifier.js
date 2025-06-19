var key_id;
var keys;

//verify token
async function verifyToken (token) {
//get Cognito keys
    const region = "eu-west-1";
    keys_url = 'https://cognito-idp.'+ region +'.amazonaws.com/' + userPoolId + '/.well-known/jwks.json';
    await fetch(keys_url)
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            keys = data['keys'];
        });

//Get the kid (key id)
    const tokenHeader = parseJWTHeader(token);
    key_id = tokenHeader.kid;

//search for the kid key id in the Cognito Keys
    const key = keys.find(key =>key.kid===key_id)
    if (key === undefined){
        return "Public key not found in Cognito jwks.json";
    }

//verify JWT Signature
    var keyObj = KEYUTIL.getKey(key);
    var isValid = KJUR.jws.JWS.verifyJWT(token, keyObj, {alg: ["RS256"]});
    if (isValid){
    } else {
        return("Signature verification failed");
    }

//verify token has not expired
    let tokenPayload = parseJWTPayload(token);
    if (Date.now() >= tokenPayload.exp * 1000) {
        return("Token expired");
    }

//verify app_client_id
    let n = tokenPayload.aud.localeCompare(appClientId);
    if (n !== 0){
        return("Token was not issued for this audience");
    }
    return("verified");
}