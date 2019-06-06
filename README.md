**Crypto-Manager**
- 
A multi-cryptocurrency dasboard system for managing multiple cryptocurrencies.
It's powered by NodeJs and MYSQL

I have included the `cryptomanager.sql` file so you can quickly setup your database in your environment.

**Features**
- 


##START SERVER
`npm install` to install all dependencies
<br/>
`npm start` to start the server


##CONFIGURE DATABASE
Server uses MYSQL database. Import `cryptomanager.sql` in MYSQL to create the database and tables for the server
</br>
###DATABASE CONFIGURATION
Update `app-config.json` and `app-production.json` file to match environment
```json
{
  "db.config": {
    "host": "127.0.0.1",
    "port": 3306,
    "database" : "cryptomanager",
    "user": "root",
    "password": "mysql"
  }
}
``` 


##GENERATE JWT PRIVATE AND PUBLIC KEY
Generate public and private key to sign and decrypt JWT Tokens
```
ssh-keygen -t rsa -b 4096 -f jwtRS256.key
 # Don't add passphrase
 openssl rsa -in jwtRS256.key -pubout -outform PEM -out jwtRS256.key.pub
 cat jwtRS256.key
 cat jwtRS256.key.pub
``` 
Include path to files in `app-config.json` and `app-production.json`
```json
{
  "session.security": {
    "name": "sessid",
    "secret": "1nUDlHmtUlQ8qENropilEkf8uMA3121d2ftQ1",
    "resave": false,
    "saveUninitialized": true,
    "session_duration": 2700000,
    "privatekey":"jwt.key",
    "publickey":"jwt.key.pub"
  }
}
```

##CONFIGURE EMAIL
Specify email credentials in `app-config.json` and `app-production.json` files
```json
{
  "mail.config": {
    "host": "smtp.zoho.com",
    "port": 465,
    "secure": true,
    "auth": {
        "user": "",
        "pass": ""
    }
  }
}
```
