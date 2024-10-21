<p align="center">
  <img width="100%" src="https://github.com/InvoiceCollector/InvoiceCollector/raw/master/images/preview/preview.svg" />
</p>

# Invoice Collector

Invoice Collector is a free docker image used to retrieve invoices and receipts from suppliers. It can connect to customer areas, APIs and inboxes to get the invoices.

## Installation

Use the [docker-compose.yml](https://github.com/InvoiceCollector/InvoiceCollector/blob/master/docker-compose.yml) file to build and run a container.

### Prerequisits
- [Install docker engine](https://docs.docker.com/engine/install/)

**Linux**:
```bash
mkdir invoice_collector
cd invoice_collector

# Get docker-compose.yml from github repo
curl https://raw.githubusercontent.com/InvoiceCollector/InvoiceCollector/refs/heads/master/docker-compose.yml >> docker-compose.yml

# Get Dockerfile from github repo
curl https://raw.githubusercontent.com/InvoiceCollector/InvoiceCollector/refs/heads/master/Dockerfile >> Dockerfile

# Pull, build and a container
sudo docker compose up --build
```

<!-- ## Usage -->
<!-- ## Contribution -->
<!-- ## FAQ -->
