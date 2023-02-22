![SADISS](https://sadiss.net/api/logo_black.png)
## A socially aggregated distributed sound system.

SADISS is a set of web applications developed in the research project ‘The Choir & the Sound System’ at Anton Bruckner university (Linz, Austria) that bundles smartphones into monumental yet intricate sound systems or choirs.

Take a look at [sadiss.net](https://sadiss.net/) to get an idea.

### License
SADISS is released under the GNU Affero General Public License ([AGPL](LICENSE)). It allows anyone to freely download, modify, run and distribute the software. Any distribution must ship its source code to the user. If you run a modified version of SADISS on a server, your server must allow users to download the source code corresponding to the modified version.

### Architecture

SADISS is composed of three distinct apps.

The SADISS server, a Node.js app, is supposed to run on a web server. It is the backbone of the SADISS network and coordinates the distribution of instructions to the registered phones.

The SADISS admin client, a Vue.js app, is supposed to run in the browser. Performers will use it to upload instruction sets and send control messages to the server.

The SADISS app, an Ionic app, is supposed to run on Android and iOS phones. It will be available in the vendor stores for all participants to download.
