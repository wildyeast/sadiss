![SADISS](https://sadiss.net/api/logo_black.png)

# Server

The SADISS server is supposed to be installed on a web server.

### Prerequisites
Make sure that your server has the following software installed:
- PHP >= v7.3
- BCMath PHP Extension
- Ctype PHP Extension
- Fileinfo PHP Extension
- JSON PHP Extension
- Mbstring PHP Extension
- OpenSSL PHP Extension
- PDO PHP Extension
- Tokenizer PHP Extension
- XML PHP Extension
- Node.js >= v16
- NPM >= v8 or yarn >= v1.22
- Composer >= v2.2.7
- MySQL >= v8

### Server configuration

Your server must redirect all requests to public/index.php. See [https://laravel.com/docs/8.x/deployment#nginx](this official Laravel documentation page) for a NGINX configuration example.

Start mysql and create a user and database.

Copy the `.env.example` file to `.env` and fill in your database name, username and password.

### Installation
In the root folder of SADISS, run the following commands:
```
composer install
php artisan migrate
npm run prod OR yarn prod
```

### Creating users
You need to create at least one user to be able to login to the performance interface. This is done in the terminal using the following command:
```php artisan make:user```
You can then login at your server's /login route.
