![SADISS](https://sadiss.net/api/logo_black.png)
## A socially aggregated distributed sound system.

SADISS is a web application developed in the research project ‘The Choir & the Sound System’ at Anton Bruckner university (Linz, Austria) that bundles smartphones into monumental yet intricate sound systems or choirs.

Unsure what this means? Take a look at [sadiss.net](https://sadiss.net/) to get an idea.

### License
SADISS is released under the GNU Affero General Public License ([AGPL](https://www.gnu.org/licenses/agpl-3.0.en.html)). This means that you can freely download, modify, run and distribute the software. If you run a modified version of SADISS on a server, your server must allow users to download the source code corresponding to the modified version.

## Getting started

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
