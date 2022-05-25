FROM amazonlinux

WORKDIR /tmp
#install the dependencies
RUN yum -y install gcc-c++ && yum -y install findutils && yum -y install tar && yum -y install gzip && yum -y install make

RUN touch ~/.bashrc && chmod +x ~/.bashrc

RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.38.0/install.sh | bash

RUN source ~/.bashrc && nvm install v12.13.0

WORKDIR /build