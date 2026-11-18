# 4.6 Broadcaster

Todo Backend julkaisee NATS-viestin tehtävän luonnin ja päivityksen jälkeen. Broadcaster vastaanottaa viestit ja lähettää ne Generic-muodossa ulkoiseen Webhook.site-palveluun.

Viestien subject on `todos.project.events`. Broadcasterin kaikki replikat käyttävät queue groupia `todo-broadcasters`, joten kukin julkaistu viesti annetaan yhdelle replikalle.

Vastaanottajan URL annetaan `WEBHOOK_URL`-ympäristömuuttujassa Kubernetes Secretin `broadcaster-webhook` kautta.

Main-haarassa broadcaster toimii kuudella replikalla. Testihaaroissa replikoita on nolla.

## Testaus GKE:ssä

Loin kuusi tehtävää ja merkitsin jokaisen valmiiksi.

| Tarkistus | Tulos |
| --- | --- |
| Broadcasterin valmiit replikat | 6/6 |
| Luontiviestit | 6 |
| Päivitysviestit | 6 |
| Yksilölliset viestitunnisteet | 12 |
| Kaksoislähetykset | 0 |

Webhook.site vastaanotti kuusi viestiä arvolla `done: false` ja kuusi arvolla `done: true`.

[Sovelluskoodi](app.js) · [Deployment](manifests/deployment.yaml)
