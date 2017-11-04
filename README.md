## Docker and Azure Container Instances Workshop

In this workshop, you will experiment with Docker containers and Azure Container instances. At the end of the workshop, you will have a static website running on Azure inside a Docker container, accessible through the public Internet. Optionally, you will also experiment with a dynamic website (with Node.js or Python) and with linking multiple containers.

- - -

### Prerequisites

You will need an Azure account to use Azure Container Instances. You can [sign up for a free trial](https://azure.microsoft.com/en-us/free/) that gives you $200 in credit for 30 days, and additional free resources without a time limit. If you already have an Azure account, this workshop should not cost you more than $1 to run (and likely a lot less, because Azure Container Instances are billed by the second).

If you'd like to use your own computer for the workshop, please install the following:

* [Docker Community Edition](https://www.docker.com/community-edition) 17.03 or later
* [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest) 2.0 or later

Or, you can use the instructor-provided lab machines, hosted in EC2. These machines are running Ubuntu and have Docker and the Azure CLI installed. To provision your own instance, log in to the event link provided by the instructor, enter the classroom token, and follow the instructions.

- - -

### Task 1: Hello, Docker

In this task, you will verify that your Docker installation is functional, start a few simple containers, and experiment with simple management commands. The containers you'll use will be pulled from the Docker Hub public registry, and they are official images provided by various software vendors.

> The following instructions assume that the current user has the proper permissions to talk to the Docker server, and that the `docker` binary is in the path. On Linux systems, you may need to prefix these commands with `sudo`, change to a root shell (`sudo su`), or add your user account to the `docker` group.

In a terminal, run the following command to get the version of your Docker client and server:

```
docker version
```

The output may look something like the following:

```
Client:
 Version:      17.06.0-ce
 API version:  1.30
 Go version:   go1.8.3
 Git commit:   02c1d87
 Built:        Fri Jun 23 21:31:53 2017
 OS/Arch:      darwin/amd64

Server:
 Version:      17.06.0-ce
 API version:  1.30 (minimum version 1.12)
 Go version:   go1.8.3
 Git commit:   02c1d87
 Built:        Fri Jun 23 21:51:55 2017
 OS/Arch:      linux/amd64
 Experimental: true
```

Next, let's run a container. The `hello-world` container is an extremely simple and minimal container that prints "Hello, World" and exits. Unlike a virtual machine, it doesn't contain a copy of an operating system and libraries, which makes the image ridiculously small. Try it:

```
docker run hello-world
```

In the previous command, `hello-world` is the name of the container image, pulled from the Docker Hub public registry by default. 

Let's take a look at the container images you now have on your machine:

```
docker images
```

Note the size of the `hello-world` container.

Next, let's try a more interesting container. The `alpine` image is a lightweight Linux distribution (~5MB), which is still surprisingly powerful and serves as the foundation of many container images. This time, we are going to run it in interactive mode so that we can input commands into the container process:

```
docker run --rm -it alpine sh
```

In the previous command, `-it` requests an interactive container and attaches a terminal; `alpine` is the container image name; `sh` is the command to run inside the container. The `--rm` switch indicates that the container should be deleted when it finishes running, because we don't need it anymore. The result is that we get a shell in the container:

```
/ # 
```

To "prove" that we are inside a container, try to navigate the local filesystem. E.g., `ls /` -- note the directories displayed compared to what you see on your local machine. When you're done, type `exit` or hit Ctrl-D to exit the shell.

Next, we're going to run a container in the background, so it continues running even if we're doing something else. This is called "daemon mode". The container we'll run is the Redis image (Redis is a very popular in-memory key-value store, often used as a cache by web applications). Run the following:

```
docker run --rm --name myredis -d redis
```

To verify that the container is running normally, run:

```
docker ps
```

Now, we're going to run a command inside an existing container. This is often done for troubleshooting purposes, because a lot of operations require taking the container's perspective to work properly. Run:

```
docker exec -it myredis redis-cli
```

You're now running a client Redis application connected to the Redis cache running in the same container. Try a couple of commands:

```
set name "Bertha Woolworth"
get name
```

For a final example, let's share a file with the container. Create a new Python file named hello.py containing the following code:

```python
import sys

print("Hello from containerized Python!")
print(sys.argv)
```

> To create a file, you can use any editor you'd like, or simply use the [example.py](example.py) file instead of writing your own.

To share this file with the container, we will use a _volume_. The container we'll use is python:alpine:

```
docker run --rm -v $PWD:/app python:alpine python /app/hello.py "hi there!"
```

The `-v` switch shares a volume with the container -- the current directory (`$PWD`) becomes `/app` in the container.

- - -

### Task 2: Building a Container to Host a Static Website with Nginx

In this task, you will create a new container images based on an existing one. The base image will be Nginx, a popular, fast, and lightweight web server. The only adaptation we'll make is adding a couple of static files to the container image. The result will be a custom container that runs our static web server.

First, run the following commands to create a Dockerfile. This is the set of instructions for creating your container image, based on the Nginx container image.

> If you're not comfortable with the vi editor, feel free to use any other editor, or simply `cp Dockerfile.solution Dockerfile` to use the "school solution" instead of writing it by hand.

```
cd web
vi Dockerfile
```

Type the following into the Dockerfile:

```
FROM nginx:alpine

COPY index.html /usr/share/nginx/html
COPY hello.png /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]
```

Let's decipher these instructions. The `FROM` instruction indicates that this container image is going to be based on the Nginx container image. Then, the `COPY` instructions move files from the build context (usually the current directory) to the specified location in the container image. Finally, the `CMD` instruction tells Docker which application should be launched when this container is run -- in our case, it's the Nginx daemon.

Next, build the container image and tag it using the following commands:

```
docker build . -t web:v1
```

In the above command, the `.` parameter is the _build context_ -- the directory that contains the Dockerfile and additional files that you want to add to the container image. The `-t` switch takes a tag, which is like a name for the container image, except an image can have multiple tags.

Finally, run the container in the background to serve the static website:

```
docker run --rm -d --name web web:v1
```

At this point, you can run `docker ps` to see that the container is running. However, there's no way for you to access it from the host, because the TCP port it is listening to is not exposed to the host. The Nginx server is only reachable from within the container!

Run `docker kill web` to kill the container, and then run the following command that runs the container and exposes the required port to the host:

```
docker run --rm -d --name web -p 80:80 web:v1
```

Here, the `-p` switch tells Docker to expose TCP port 80 to the host on port 80. Now you can navigate to `http://localhost` in a browser on your host and see the static website we put in the Nginx container!

> If you already have something listening on port 80 on your machine, there might be a conflict and Nginx won't be able to serve requests. In that case, just modify the `-p 80:80` directive to use some other port. Note that the first port number is the port _within the container_, and the second port number is the port on the host.

- - -

### Task 3: Pushing to Docker Hub

In this task, you will publish the extremely useful container you've built to Docker Hub, one of the public Docker image registries. By publishing the image to Docker Hub, anyone on the Internet will be able to pull this image and use it to launch containers. In many production applications, this is not acceptable: you can host your own private Docker registry, or use one of the publicly available secure hosting services provided by Docker and the major public cloud providers.

First, you will need a Docker ID to push your image. [Sign up](https://cloud.docker.com/) for a Docker ID if you don't already have one.

Now, you will need to tag your container image with your Docker ID. In the following command, replace `YOURUSERNAME` with your Docker username.

```
docker tag web:v1 YOURUSERNAME/web:v1
```

Now you're ready to push the image to Docker Hub:

```
docker push YOURUSERNAME/web:v1
```

This may take a few minutes, depending on the speed of your Internet connection. The Docker Hub registry should detect, however, that most of the image's layers haven't been modified -- our changes are really limited to a couple of files that we copied into the image. When the push is complete, navigate to [Docker Hub](https://hub.docker.com) and find your new container image under your profile. At this point, you could pull this image from a different machine using the following command
(you could ask a friend or a colleague to try it out for you):

```
docker pull YOURUSERNAME/web:v1
```

- - -

### Task 4: Creating an Azure Container Instance

In this task, things get really interesting -- once we have our container image publicly available on a Docker registry, we can use one of many container orchestration services to launch containers from that image. These services include Amazon ECS, Google Kubernetes, Docker Swarm, Azure Container Service, and many others. However, many of these services require mastering a lot of extra concepts before you can launch a container. Just as an example, Kubernetes has the concepts of pod,
service, replica set, and deployment that you need to understand to use it effectively. Instead, we will use a new service called Azure Container Instances: it is geared towards simpler use cases when you want to launch one, two, or a handful of containers without worrying too much about scaling, managing, and deploying them.

First, please make sure you have an Azure account. If not, see the Prerequisites section above to register for an account and download the Azure CLI. Then, open a terminal and log in to your Azure account by running the following command:

```
az login
```

You will need to navigate to the [Azure login page](https://aka.ms/devicelogin) and enter the token provided by `az login`. A few seconds later, you will be logged in to your account and will be able to use the Azure CLI commands.

The commands for managing Azure Container Instances are all sub-commands of `az container`. Try `az container --help` to see which commands are available. You will notice that creating a container requires a _container group_ -- but that's almost all there's to it. Additionally, containers need to know which region you want them to be in: Azure has numerous regions all over the world. To specify the region for your container group, you create a _resource group_, which is tied to a specific
region.

Begin by creating a resource group for your containers:

```
az group create --name acigroup --location westeurope
```

Next, you can create a container (really, a container group with a single container) from the previously-published container image:

```
az container create --name aciweb --image YOURUSERNAME/web:v1 -g acigroup --ip-address public
```

In the preceding command, `--ip-address public` indicates that you want the container's ports to be exposed and for a public IP address to be associated with it, so that you can access it over the Internet. This command may take a few moments, because a private virtual machine is being spinned up to run your container. You can use the following command to see its status:

```
az container show --name aciweb -g acigroup
```

The output may look something like the following:

```
{
  "containers": [
    {
      "command": null,
      "environmentVariables": [],
      "image": "goldshtn/web:v1",
      "instanceView": {
        "currentState": {
          "detailStatus": "",
          "exitCode": null,
          "finishTime": null,
          "startTime": "2017-11-03T20:09:49+00:00",
          "state": "Running"
        },
        "events": [
          {
            "count": 1,
            "firstTimestamp": "2017-11-03T20:09:44+00:00",
            "lastTimestamp": "2017-11-03T20:09:44+00:00",
            "message": "pulling image \"goldshtn/web:v1\"",
            "name": "Pulling",
            "type": "Normal"
          },
          {
            "count": 1,
            "firstTimestamp": "2017-11-03T20:09:49+00:00",
            "lastTimestamp": "2017-11-03T20:09:49+00:00",
            "message": "Successfully pulled image \"goldshtn/web:v1\"",
            "name": "Pulled",
            "type": "Normal"
          },
          {
            "count": 1,
            "firstTimestamp": "2017-11-03T20:09:49+00:00",
            "lastTimestamp": "2017-11-03T20:09:49+00:00",
            "message": "Created container with id fb7c5041bb39176d57890438fcddb4546063ade59c18db0248f4c841b8f4f90a",
            "name": "Created",
            "type": "Normal"
          },
          {
            "count": 1,
            "firstTimestamp": "2017-11-03T20:09:49+00:00",
            "lastTimestamp": "2017-11-03T20:09:49+00:00",
            "message": "Started container with id fb7c5041bb39176d57890438fcddb4546063ade59c18db0248f4c841b8f4f90a",
            "name": "Started",
            "type": "Normal"
          }
        ],
        "previousState": null,
        "restartCount": 0
      },
      "name": "web",
      "ports": [
        {
          "port": 80,
          "protocol": null
        }
      ],
      "resources": {
        "limits": null,
        "requests": {
          "cpu": 1.0,
          "memoryInGb": 1.5
        }
      },
      "volumeMounts": null
    }
  ],
  "id": "/subscriptions/1209ae93-342e-4ce4-ae01-2b4f7305e6ac/resourceGroups/aci-westeurope/providers/Microsoft.ContainerInstance/containerGroups/web",
  "imageRegistryCredentials": null,
  "instanceView": {
    "events": [],
    "state": "Running"
  },
  "ipAddress": {
    "ip": "52.233.139.19",
    "ports": [
      {
        "port": 80,
        "protocol": "TCP"
      }
    ]
  },
  "location": "westeurope",
  "name": "web",
  "osType": "Linux",
  "provisioningState": "Succeeded",
  "resourceGroup": "aci-westeurope",
  "restartPolicy": null,
  "tags": null,
  "type": "Microsoft.ContainerInstance/containerGroups",
  "volumes": null
}
```

When the container instance moves to the "Running" state, you can navigate to the IP address displayed in the output of the previous command in a web browser. Voila, your container is serving requests and is available on the public Internet!

> By default, the `az container create` command exposes port 80 from the container to port 80 on the host. This can be customized by using the `--port` switch, or by creating the container from an Azure Resource Management template, which is outside the scope of this workshop.

For troubleshooting purposes, it is often useful to extract logs from your container. Run the following command to list the logs from Nginx:

```
az container logs --name aciweb -g acigroup
```

Finally, when you're done, to avoid any charges from being incurred to your Azure account, make sure to delete the container with the following command:

```
az container delete --name aciweb -g acigroup
```

- - -

### Additional Ideas

If you're done with the above tasks and would like to continue experimenting, here are some ideas (some of them might take a few hours!):

* Create a dynamic website, or an API, and put in in a Docker container. For example, you can use Flask with Python or Express with Node.js. Package that container and run it in Azure Container Instances. Here's an example of a trivial Node.js server that you could use (also in [example.js](example.js)):

```javascript
var http = require('http');

var server = http.createServer(function (req, res) {
    res.end(200, 'Hello, world!');
});

server.listen(80);
```

* Create another container running the Redis cache, and link it to the original container so that the web application can access the Redis cache. If you're running the two containers locally with Docker, you can use the [`--link` switch](https://docs.docker.com/engine/userguide/networking/default_network/dockerlinks/) to link the two containers, or create a Docker network. If you want to launch the two containers in Azure Container Instances, you'll need to use an [ARM deployment
  template](https://docs.microsoft.com/en-us/azure/container-instances/container-instances-multi-container-group) (deploying a container group with more than one container is not supported
  from the CLI).

* Explore the scaling options for Azure Container Instances. Clearly, you could easily create multiple instances of the same container -- but you'd need the clients to perform the load balancing. What are the built-in options for load balancing traffic between multiple containers in Azure Container Instances?

* Azure Container Instances does not attempt to be a full-blown container orchestration solution. It doesn't have features such as scheduling, monitoring, load balancing, daemons, and many other features a container orchestration can provide. Explore either [Docker Swarm](https://docs.docker.com/engine/swarm/) or [Azure Managed Kubernetes Service](https://docs.microsoft.com/en-us/azure/aks/), and try using them to schedule your containers.

* One of the features offered by container runtimes is placing quotas on container resource usage (on Linux, this is implemented using control groups). For example, Docker makes it easy to place [CPU and memory limits](https://docs.docker.com/engine/admin/resource_constraints/) on containers. Try this out: launch a container with only a few megabytes of memory and see what happens; or, launch a container with only 0.1 of a CPU and see how its performance degrades.

* [Docker Compose](https://docs.docker.com/compose/overview/) is a tool for creating multi-container builds and deployments. You can specify multiple container images, volumes, ports, and other instructions in a single file, and have Docker Compose bring all the containers up or down in a single command. Explore Docker Compose, and create a .yml file that deploys our web application container, a Redis cache, and a MySQL database -- ideally, linking them so you can use Redis and MySQL
  from the web application.

- - -
