FROM node:16

ARG RUBY_VERSION=2.6.1
ENV NPM_GLOBAL_PREFIX=/npm

WORKDIR /coco

ENV PATH $PATH:/root/.rbenv/bin:/root/.rbenv/shims
RUN apt-get update && \
    apt-get install -y git curl libssl-dev libreadline-dev zlib1g-dev autoconf bison \
                       build-essential libyaml-dev libncurses5-dev \
                       libffi-dev libgdbm-dev && \
    curl -sL https://github.com/rbenv/rbenv-installer/raw/main/bin/rbenv-installer | bash -

RUN rbenv install ${RUBY_VERSION} && \
    rbenv global ${RUBY_VERSION}

RUN mkdir $NPM_GLOBAL_PREFIX && \
    npm config set prefix $NPM_GLOBAL_PREFIX --global

COPY . .
