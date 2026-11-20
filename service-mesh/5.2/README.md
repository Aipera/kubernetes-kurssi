# 5.2 Getting started with Istio service mesh

Tehtävässä asennettiin Istio ambient -tilassa paikalliseen k3d-klusteriin
ja testattiin Bookinfo-esimerkkisovellusta.

## Ympäristö

- Klusteri: `istio-lab`, konteksti `k3d-istio-lab`
- k3d: 5.9.0
- Kubernetes: v1.37.2+k3s1
- Istio: 1.32.0
- Prometheus ja Kiali: Istion mukana toimitetut esimerkkimääritykset
- Prometheuksen namespace: `istio-system`

## Toteutus

Bookinfo julkaistiin Kubernetes Gateway API:n kautta.
Namespace `default` liitettiin ambient-meshiin:

```powershell
kubectl --context=k3d-istio-lab label namespace default `
    istio.io/dataplane-mode=ambient --overwrite
```

Ambient-tilassa ztunnel huolehtii yhteyksien suojauksesta ja L4-käyttöoikeuksista.
Waypoint lisättiin HTTP-tason käyttöoikeuksia ja liikenteenjakoa varten:

```powershell
$istio = Join-Path $env:USERPROFILE 'tools\istio-1.32.0\bin\istioctl.exe'

& $istio --context=k3d-istio-lab --namespace=default `
    waypoint apply --enroll-namespace --wait
```

Waypoint saavutti tilan `Programmed=True`.

## Määritystiedostot

- [productpage-ztunnel.yaml](productpage-ztunnel.yaml):
  sallii productpage-podeille yhteydet gatewaylta ja waypointilta.
- [productpage-waypoint.yaml](productpage-waypoint.yaml):
  sallii curl-asiakkaalle vain GET-pyynnöt productpage-palveluun.
- [reviews-route.yaml](reviews-route.yaml):
  jakaa reviews-liikenteen painoilla 90 % v1 ja 10 % v2.

Määritykset otetaan käyttöön repositorion juuresta:

```powershell
kubectl --context=k3d-istio-lab apply -f service-mesh/5.2/
```

## Käyttöoikeuksien testaus

Ennen waypointin lisäämistä L4-käyttöoikeus salli yhteydet vain gatewaylta:

| Testi | Tulos |
| --- | --- |
| Bookinfo gatewayn kautta | HTTP 200 |
| curl-podin suora yhteys productpage-palveluun | Yhteys estetty, curl exit code 56 |

Waypointin ja L7-käyttöoikeuden lisäämisen jälkeen:

| Testi | Tulos |
| --- | --- |
| GET curl-podista | HTTP 200 |
| DELETE curl-podista | HTTP 403, RBAC: access denied |
| GET reviews-v1-podista | HTTP 403, RBAC: access denied |

## Liikenteenjaon testaus

Productpage-palveluun lähetettiin 100 testipyyntöä.
Vastauksista tunnistettiin pyynnön käsitellyt reviews-versio.

| Versio | Pyyntöjä |
| --- | --- |
| reviews-v1 | 92 |
| reviews-v2 | 8 |
| reviews-v3 | 0 |

Tulos vastaa määritettyä 90/10-painotusta.
Yksittäisen testiajon osuudet vaihtelevat satunnaisesti.

## Käyttöliittymät

Bookinfo ja Kiali avataan port-forwardeilla eri PowerShell-ikkunoissa:

```powershell
kubectl --context=k3d-istio-lab -n default `
    port-forward svc/bookinfo-gateway-istio 8080:80
```

```powershell
kubectl --context=k3d-istio-lab -n istio-system `
    port-forward svc/kiali 20001:20001
```

- Bookinfo: http://localhost:8080/productpage
- Kiali: http://localhost:20001/kiali

Kialin Traffic Graph -näkymässä tarkasteltiin default-namespacen
palveluita ja niiden välistä liikennettä.

## Asennuksessa huomioitua

Tässä K3s-versiossa Istion CNI-binäärien hakemisto määritettiin erikseen:

```powershell
& $istio --context=k3d-istio-lab install `
    --set profile=ambient `
    --set values.global.platform=k3d `
    --set values.cni.cniBinDir=/var/lib/rancher/k3s/data/cni `
    --skip-confirmation
```

## Ohje

[Istio ambient getting started](https://istio.io/latest/docs/ambient/getting-started/)