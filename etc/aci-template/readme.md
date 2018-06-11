# ARM Template - Azure Container Instance
Deploy the RayScale app using Azure Container Instances (ACI), this will create one controller and any number of tracers

## Deployed Resources
- Microsoft.ContainerInstance/containerGroups

## Parameters
- `tracerCount`: Number of tracers to deploy
- `dnsPrefix`: Prefix for all DNS names

## Outputs
- `controllerURL`: URL to access the controller web UI

## Quick Deploy
[![deploy](https://raw.githubusercontent.com/benc-uk/azure-arm/master/etc/azuredeploy.png)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fbenc-uk%2Frayscale%2Fmaster%2Fetc%2Faci-template%2Fazuredeploy.json)  

## Notes
The `HEALTH_CHECK_INTERVAL` on the controller is set very high (150 seconds) as ACI sometimes takes a couple of minutes for public IP and DNS to become active. Even if the tracers appear online in the Web UI, it is worth waiting and testing a few manually in your browser, before starting a render. You can test a tracer with the health ping API call, GET `http://{tracer-name}.{region}.azurecontainer.io/api/ping`