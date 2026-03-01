FROM alpine:3.19

RUN apk add --no-cache curl jq bash python3 unzip

# Install terraform manually so WE control the entrypoint
ENV TERRAFORM_VERSION=1.7.5
RUN curl -fsSL "https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip" -o /tmp/terraform.zip \
    && unzip /tmp/terraform.zip -d /usr/local/bin/ \
    && rm /tmp/terraform.zip \
    && terraform version

WORKDIR /workspace/terraform

ENTRYPOINT []
CMD ["tail", "-f", "/dev/null"]
