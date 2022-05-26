# Certificate generation

See  https://www.freecodecamp.org/news/how-to-get-https-working-on-your-local-development-environment-in-5-minutes-7af615770eec/

## Step 1 - Generate trusted root certficate
```
openssl genrsa -des3 -out rootCA.key 2048
openssl req -x509 -new -nodes -key rootCA.key -sha256 -days 1024 -out rootCA.pem
```

## Step 2 - Install rootCA.pem into the system/browser

## Step 3 - Generate ssl certificate (node js websocket)
```
openssl req -new -sha256 -nodes -out server.csr -newkey rsa:2048 -keyout server.key -config <( cat server.csr.cnf )
openssl x509 -req -in server.csr -CA rootCA.pem -CAkey rootCA.key -CAcreateserial -out server.crt -days 500 -sha256 -extfile v3.ext
```

## Step 4 - Copy the private key and certificate into your ssl folder (~/.ssh/ssl)


## Step 5 - Generate lighttpd certificate
```
cat server.crt > server.pem
cat server.key >> server.pem
```

## Step 6 - Copy the pem file where your lighttpd configuration is expecting it
```
ex: cp server.pem /etc/lighttpd/certs/
```
