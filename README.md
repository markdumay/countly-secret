# countly-secret (work in progress)

<!-- Tagline -->
<p align="center">
    <b>Deploy Countly Analytics as Docker Stack with Secure Credentials</b>
    <br />
</p>


<!-- Badges -->
<p align="center">
    <a href="https://github.com/markdumay/countly-secret/commits/master" alt="Last commit">
        <img src="https://img.shields.io/github/last-commit/markdumay/countly-secret.svg" />
    </a>
    <a href="https://github.com/markdumay/countly-secret/issues" alt="Issues">
        <img src="https://img.shields.io/github/issues/markdumay/countly-secret.svg" />
    </a>
    <a href="https://github.com/markdumay/countly-secret/pulls" alt="Pulls">
        <img src="https://img.shields.io/github/issues-pr-raw/markdumay/countly-secret.svg" />
    </a>
    <a href="https://github.com/markdumay/countly-secret/blob/master/LICENSE" alt="License">
        <img src="https://img.shields.io/github/license/markdumay/countly-secret.svg" />
    </a>
</p>

<!-- Table of Contents -->
<p align="center">
  <a href="#about">About</a> •
  <a href="#built-with">Built With</a> •
  <a href="#prerequisites">Prerequisites</a> •
  <a href="#testing">Testing</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#usage">Usage</a> •
  <a href="#donate">Donate</a> •
  <a href="#license">License</a>
</p>


## About
[Countly][countly_info] is an open-source analytics platform to track customer journeys in web, desktop, and mobile applications. The community edition has a free-to-use non-commercial license and can be self-hosted. Countly consists of an API and a portal, using a Mongo database for data persistency. Countly Secret is a configuration script to deploy Countly, a Mongo database, and a reverse proxy as Docker containers. It uses Docker Swarm secrets to secure the database credentials. 

<!-- TODO: add tutorial deep-link 
Detailed background information is available on the author's [personal blog][blog].
-->

## Built With
The project uses the following core software components:
* [Countly][countly_url] - Analytics platform
* [Docker][docker_url] - Container platform (including Swarm and Compose)
* [MongoDB][mongodb_url] - Document-based distributed database
* [HTTPS Portal][portal_url] - Fully automated HTTPS server


## Prerequisites
Countly Secret can run on a local machine for testing purposes or in a production environment. The setup has been tested locally on macOS and a Virtual Private Server (VPS) running Ubuntu 18.04 LTS.

### Recommended Server Sizing
In a minimal setup, Countly and its accompanying Mongo database can be deployed on the same server. For a website with moderate traffic, 2 CPU cores, 4 GB of RAM and 100 GB disk space should be sufficient to get you started. This [overview][countly_deployment] shows the setup for requirements and deployment options for increased workload levels.

### Host Operating System
As Countly will be deployed as a Docker container, in theory any host operating system will do, as long as it supports Docker. However, for a production system, a Long Term Support (LTS) version of a major Linux distribution such as Ubuntu or CentOS is recommended. 

### Other Prerequisites
* <b>A registered domain name is required</b> - 
Not only will this help you access the Countly dashboard and API, but it is also required for configuring SSL certificates to enable secure web traffic. You should have the ability to manually configure DNS entries for your domain too.

* <b>Docker Compose and Docker Swarm are required</b> - Countly and the Mongo Database will be deployed as Docker containers in swarm mode to enable Docker *secrets*.

* <b>An email service is optional</b> - Having an email service allows you to receive system notifications from Countly.
<!-- TODO: email configuration -->

## Testing
It is recommended to test the services locally before deploying them to production. Running the services with `docker-compose` greatly simplifies the validation of the service logs. Below four steps will allow you to run the services on your local machine.

### Step 1 - Clone the Repository
The first step is to clone the repository to a local folder. Assuming you are in the working folder of your choice, clone the repository files. Git automatically creates a new folder `countly-secret` and copies the files to this directory. The option `--recurse-submodules` ensures the embedded submodules are fetched too. Now change your working folder to be prepared for the next steps.

```console
git clone --recurse-submodules https://github.com/markdumay/countly-secret.git
cd countly-secret
```

### Step 2 - Create Docker Secret Files
As Docker-compose does not support external Swarm secrets, we will create local secret files for testing purposes. The credentials are stored as plain text, so this is not recommended for production.

```console
mkdir secrets
printf admin > secrets/mongodb_root_username.txt
printf password > secrets/mongodb_root_password.txt
printf countly > secrets/countly_mongodb_username.txt
printf password > secrets/countly_mongodb_password.txt
```

### Step 3 - Update the Environment Variables
The `docker-compose.yml` file uses environment variables to simplify the configuration. You can use the sample file in the repository as a starting point.

```console
mv sample.env .env
```

The `.env` file specifies four variables. Adjust them as needed.
```
MONGODB_DATABASE=countly
DOMAINS_COUNTLY=countly.example.test
COUNTLY_API_HOST=http://api:3001
COUNTLY_FRONTEND_HOST=http://frontend:6001
```

It's convenient to use a `.test` top-level domain for testing. This domain is reserved for this purpose and is guaranteed not to clash with an existing domain name. However, you will still need to resolve these domains on your local machine. Steven Rombauts wrote an excellent [tutorial][macos_dnsmasq] on how to configure this using `dnsmasq` on macOS.

### Step 4 - Run with Docker Compose
Test the Docker services with `docker-compose`. You can stop the services with the command `ctrl-c`.

```console
docker-compose up
```

### Step 5 - Validate the Service Logs
The initialization of the services typically takes a few minutes. Below key messages show the status of the individual services and indicate when they are ready.

```
mongodb_1   | I  CONTROL  [initandlisten] options: { net: { bindIp: "*" }, security: { authorization: "enabled" } }
mongodb_1   | I  NETWORK  [listener] Listening on 0.0.0.0
frontend_1  | Done.
frontend_1  | removed ** packages and audited ** packages in **s
api_1       | Done.
api_1       | removed ** packages and audited ** packages in **s
portal_1    | Self-signing test certificate for countly.example.test
portal_1    | [services.d] done.
```

## Deployment
The steps for deploying in production are slightly different than for local testing. Below six steps guide you through the setup.

### Step 1 - Clone the Repository
The first step is to clone the repository to a local folder. Assuming you are in the working folder of your choice, create a new directory `countly-secret` (or any folder name of your liking) and clone the repository files. The final `.` instructs git to put the files in the current directory.

```console
mkdir countly-secret
cd countly-secret
git clone https://github.com/markdumay/countly-secret.git .
```


### Step 2 - Create Docker Swarm Secrets
Docker secrets can be easily created using pipes. The passwords are randomized using `openssl`, but feel free to use another method to your liking. Do not forget the include the final `-`, as this instructs Docker to use piped input. 

```console
printf admin | docker secret create mongodb_root_username -
openssl rand -base64 32 | docker secret create mongodb_root_password -
printf countly | docker secret create countly_mongodb_username -
openssl rand -base64 32 | docker secret create countly_mongodb_password -
```

If you do not feel comfortable copying secrets from your command line, you can use the wrapper `create_secret.sh`. This script prompts for a secret and ensures sensitive data is not displayed in your console. The script is available in the folder `/docker-secret` of your repository.

```console
./create_secret.sh mongodb_root_username
./create_secret.sh mongodb_root_password
./create_secret.sh countly_mongodb_username
./create_secret.sh countly_mongodb_password
```

### Step 3 - Update the Docker Compose File
The `docker-compose.yml` in the repository defaults to set up for local testing. Update the `secrets` section to use Docker Swarm secrets instead of local files.

```Dockerfile
secrets:
    mongodb_root_username:
        external: true
    mongodb_root_password:
        external: true
    countly_mongodb_username:
        external: true
    countly_mongodb_password:
        external: true
```

In the same file, instruct HTTPS Portal to request certificates from Let's Encrypt by setting the `STAGE` environment variable to `production`.
```Dockerfile
services:
    portal:
        environment:
            STAGE: production
```

### Step 4 - Update the Environment Variables
The `docker-compose.yml` file uses environment variables to simplify the configuration. You can use the sample file in the repository as a starting point.

```console
mv sample.env .env
```

The `.env` file specifies four variables. Adjust them as needed. Docker creates an alias for the hostnames, so you should not have to rename `api` to `countly_api` or `frontend` to `countly_frontend`.
```
MONGODB_DATABASE=countly
DOMAINS_COUNTLY=countly.example.com
COUNTLY_API_HOST=http://api:3001
COUNTLY_FRONTEND_HOST=http://frontend:6001
```


### Step 5 - Run with Docker Stack
Unlike Docker Compose, Docker Stack does not automatically create local folders. Create an empty folder for the Mongo database and the HTTPS portal. Next, deploy the Docker Stack using `docker-compose` as input. This ensures the environment variables are parsed correctly.

```console
mkdir data
mkdir data/mongodb
mkdir data/portal
docker-compose config | docker stack deploy -c - countly
```

### Step 6 - Inspect the Status of the Stack
Run the following command to inspect the status of the Docker Stack.

```console
docker stack services countly
```

You should see the value `1/1` for `REPLICAS` for each service if the stack was initialized correctly. It might take a while before the services are up and running, so simply repeat the command after a few minutes if needed.

```
ID  NAME                MODE        REPLICAS    IMAGE                               PORTS
*** countly_frontend    global      1/1         markdumay/countly-frontend:20.04
*** countly_portal      replicated  1/1         steveltn/https-portal:1             *:80->80/tcp, *:443->443/tcp
*** countly_api         replicated  1/1         markdumay/countly-api:20.04
*** countly_mongodb     replicated  1/1         mongo:4.2
```

Debugging swarm services can be quite challenging. If for some reason your service does not initiate properly, you can get its task ID with `docker service ps <service-name>`. Running `docker inspect <task-id>` might give you some clues to what is happening. If the service did initiate correctly, you can view the service log with `docker service logs <service-name>`. Use `docker stack rm countly` to remove the docker stack entirely. Be aware not to redeploy the stack before all services and networks have been completely removed, as this might result in [errors][issue_30942].


## Usage
Open your internet browser and navigate to the URL specified in your `.env` file. The default value is `countly.example.test` or `countly.example.com` pending you are in test mode or production. The site's certificate is self-signed in a local setup, so you might need to instruct your internet browser to trust this certificate. The site should now display the welcome screen of Countly and will ask you to set up an administrative user. 

![Countly setup screen][image_setup]

If you do not see the full dashboard, try to log in again. Countly is now ready for use.

![Countly home screen][image_home]


## Contributing
1. Clone the repository and create a new branch 
    ```
    $ git checkout https://github.com/markdumay/countly-secret.git -b name_for_new_branch
    ```
2. Make and test the changes
3. Submit a Pull Request with a comprehensive description of the changes

## Donate
<a href="https://www.buymeacoffee.com/markdumay" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/lato-orange.png" alt="Buy Me A Coffee" style="height: 51px !important;width: 217px !important;"></a>

## License
<a href="https://github.com/markdumay/countly-secret/blob/master/LICENSE" alt="License">
    <img src="https://img.shields.io/github/license/markdumay/countly-secret.svg" />
</a>

Copyright © [Mark Dumay][blog]



<!-- MARKDOWN LINKS -->
[countly_deployment]: https://support.count.ly/hc/en-us/articles/360037814151-Deployment-scenarios
[countly_info]: https://count.ly/product
[countly_url]: https://count.ly
[docker_url]: https://docker.com
[issue_30942]: https://github.com/moby/moby/issues/30942
[macos_dnsmasq]: https://www.stevenrombauts.be/2018/01/use-dnsmasq-instead-of-etc-hosts/
[mongodb_url]: https://mongodb.com
[portal_url]: https://github.com/SteveLTN/https-portal
<!-- TODO: add blog link
[blog]: https://markdumay.com
-->
[blog]: https://github.com/markdumay
[repository]: https://github.com/markdumay/countly-secret.git

<!-- MARKDOWN IMAGES -->
[image_setup]: images/countly-setup.png
[image_home]: images/countly-home.png

