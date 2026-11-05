# Log output

Sovellus arpoo käynnistyessään UUID:n ja tulostaa saman tunnisteen
uuden aikaleiman kanssa viiden sekunnin välein.

## Käynnistys

Aja komennot `log-output`-kansiossa, kun `k3s-default`-klusteri on käynnissä.

```cmd
docker build -t log-output:1.1 .
k3d image import log-output:1.1 -c k3s-default
kubectl apply -f manifests/deployment.yaml
kubectl rollout status deployment/log-output
kubectl logs -f deployment/log-output
```
