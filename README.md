## Docker and Azure Container Instances Workshop

In this workshop, you will experiment with Docker containers and Azure Container instances. At the end of the workshop, you will have a static website running on Azure inside a Docker container, accessible through the public Internet. Optionally, you will also experiment with a dynamic website (with Node.js or Python) and with linking multiple containers.

- - -

### Prerequisites

You will need an Azure account to use Azure Container Instances. You can sign up for a free trial that gives you $200 in credit for 30 days, and additional free resources without a time limit. If you already have an Azure account, this workshop should not cost you more than $1 to run (and likely a lot less, because Azure Container Instances are billed by the second).

If you'd like to use your own computer for the workshop, please install the following:

* Docker Community Edition 17.03 or later
* Azure CLI

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

Next, let's run a container. The `helloworld` container is an extremely simple and minimal container that prints "Hello, World" and exits. Unlike a virtual machine, it doesn't contain a copy of an operating system and libraries, which makes the image ridiculously small. Try it:

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

To share this file with the container, we will use a _volume_. The container we'll use is python:alpine:

```
docker run --rm -v $PWD:/app python:alpine python /app/hello.py "hi there!"
```

The `-v` switch shares a volume with the container -- the current directory (`$PWD`) becomes `/app` in the container.

- - -

### Task 2: Building a Container to Host a Static Website with Nginx

In this task, you will create a new container images based on an existing one. The base image will be Nginx, a popular, fast, and lightweight web server. The only adaptation we'll make is adding a couple of static files to the container image. The result will be a custom container that runs our static web server.

First, run the following commands to create a Dockerfile. This is the set of instructions for creating your container image, based on the Nginx container image.

> If you're not comfortable with the vi editor, feel free to use any other editor, or simply `cp Dockerfile.complete Dockerfile` to use the "school solution" instead of writing it by hand.

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
docker build web -t web:v1
docker tag web:v1 myuser/web:v1
```

And finally, run the container in the background to serve the static website:

```
docker run --rm -d --name web web:v1
```

At this point, you can run `docker ps` to see that the container is running. However, there's no way for you to access it from the host, because the TCP port it is listening to is not exposed to the host. The Nginx server is only reachable from within the container!

Run `docker kill web` to kill the container, and then run the following command that runs the container and exposes the required port to the host:

```
docker run --rm -d --name web -p 80:80 web:v1
```

Here, the `-p` switch tells Docker to expose TCP port 80 to the host on port 80. Now you can navigate to `http://localhost` in a browser on your host and see the static website we put in the Nginx container!

- - -

### Task 3: Pushing to Docker Hub

- - -

### Task 4: Creating an Azure Container Instance

- - -

### Additional Ideas

If you're done with the above tasks and would like to continue experimenting, here are some ideas (some of them might take a few hours!):

* Create a dynamic website, or an API, and put in in a Docker container. For example, you can use Flask with Python or Express with Node.js. Package that container and run it in Azure Container Instances.

* <<TODO>> Redis cache container linked to the original

* <<TODO>> MySQL database container linked to the original

* <<TODO>> Scaling ACI (multiple containers of the same type with a load balancer?)

* <<TODO>> Exploring Docker Swarm or Kubernetes (on ACS or AKS)

* <<TODO> Experiment with container resource limits (--cpus, --memory)

* <<TODO>> Experiment with Docker Compose

- - -
