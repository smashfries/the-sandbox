FROM ubuntu:latest
WORKDIR /app

RUN apt update && apt -y upgrade
RUN apt -y install wget gpg
RUN wget -O - https://apt.corretto.aws/corretto.key | gpg --dearmor -o /usr/share/keyrings/corretto-keyring.gpg && \
echo "deb [signed-by=/usr/share/keyrings/corretto-keyring.gpg] https://apt.corretto.aws stable main" | tee /etc/apt/sources.list.d/corretto.list

RUN apt-get update; apt-get install -y java-21-amazon-corretto-jdk

RUN echo "#!/bin/bash" >> code-execution.sh
RUN echo "cd code && javac \$(ls -1 | head -1) && java \$(ls -1 | head -1 | cut -d. -f1)" >> code-execution.sh
RUN chmod +x code-execution.sh
