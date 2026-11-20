# 5.1 DIY CRD & Controller

Harjoituksessa toteutettiin oma Kubernetes-resurssi DummySite ja sitä käsittelevä Node.js-controller.

## Toiminta

DummySite-resurssin `spec.website_url` määrittää kopioitavan verkkosivun URL:n.

Controller seuraa DummySite-resursseja Kubernetes API:n kautta. Se hakee sivun HTML:n ja luo automaattisesti:

- ConfigMapin, joka sisältää HTML:n.
- Deploymentin, jossa Nginx tarjoilee kopioidun sivun.
- ClusterIP Servicen sivun käyttämiseen.

Controller käyttää ServiceAccountia. Role ja RoleBinding rajaavat sen oikeudet dummysite-namespaceen.

Luoduilla resursseilla on ownerReferences-viittaus DummySite-objektiin, joten Kubernetes siivoaa ne omistajan poistamisen yhteydessä.

HTML:n enimmäiskoko on 512 KiB. Monimutkaisten sivujen ulkoasu voi poiketa alkuperäisestä.

## DummySite-esimerkki

```yaml
apiVersion: stable.dwk/v1
kind: DummySite
metadata:
  name: example
  namespace: dummysite
spec:
  website_url: https://example.com/
```

## Käyttöönotto

Controllerin konttikuva rakennetaan hakemiston Dockerfilella. Deploymentin käyttämä kuva on:

`europe-north1-docker.pkg.dev/project-e08f1dba-8ab7-491a-90a/kurssi/dummysite-controller:5.1`

Suorita repositorion juuresta:

```powershell
$gkeContext = 'gke_project-e08f1dba-8ab7-491a-90a_europe-north1-b_dwk-cluster'

kubectl --context=$gkeContext apply -f dummysite/manifests/namespace.yaml -f dummysite/manifests/crd.yaml -f dummysite/manifests/rbac.yaml

kubectl --context=$gkeContext wait --for=condition=Established crd/dummysites.stable.dwk --timeout=60s

kubectl --context=$gkeContext apply -f dummysite/manifests/controller.yaml

kubectl --context=$gkeContext -n dummysite rollout status deployment/dummysite-controller --timeout=180s

kubectl --context=$gkeContext apply -f dummysite/manifests/example.yaml

kubectl --context=$gkeContext -n dummysite wait dummysite/example "--for=jsonpath={.status.phase}=Provisioned" --timeout=120s

$siteDeployment = kubectl --context=$gkeContext -n dummysite get dummysite example -o jsonpath='{.status.deploymentName}'

kubectl --context=$gkeContext -n dummysite rollout status "deployment/$siteDeployment" --timeout=180s
```

## Sivun avaaminen

```powershell
$siteService = kubectl --context=$gkeContext -n dummysite get dummysite example -o jsonpath='{.status.serviceName}'

kubectl --context=$gkeContext -n dummysite port-forward "service/$siteService" 8090:80
```

Avaa selaimessa http://localhost:8090.

## Testaus

DummySite luotiin osoitteella https://example.com/.

Controller loi automaattisesti ConfigMapin, Deploymentin ja Servicen. Sekä controllerin että sivun Deployment valmistuivat onnistuneesti.

Sivun kopio avautui selaimessa port-forwardin kautta ja näytti Example Domain -sivun sisällön.
