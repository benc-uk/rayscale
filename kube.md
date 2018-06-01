
# Run Controller
```
kubectl run --image=bencuk/rayscale-controller controller --port=9000
kubectl run --image=bencuk/rayscale-tracer tracer --port=8500 --env="CONTROLLER_ENDPOINT=http://ctrl-svc:9000/api" --env="USE_IPADDRESS=true"
```

```
kubectl expose deployment controller --port=9000 --target-port=9000 --name=ctrl-svc
kubectl expose deployment controller --port=80 --target-port=9000 --name=ctrl-http --type=LoadBalancer
```