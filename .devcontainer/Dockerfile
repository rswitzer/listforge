# The base devcontainer image ships /etc/apt/sources.list.d/yarn.list with a
# signing key that has rotated upstream (NO_PUBKEY 62D54FD4003F6525), which
# breaks `apt-get update` for any devcontainer feature that runs it (e.g.
# docker-outside-of-docker). We use Corepack/pnpm and don't need Yarn's apt
# source — drop it before features install.
FROM mcr.microsoft.com/devcontainers/dotnet:1-9.0-bookworm

RUN rm -f /etc/apt/sources.list.d/yarn.list
