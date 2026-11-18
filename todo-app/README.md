## 4.6 NATS messaging

Backend julkaisee onnistuneen tietokantatallennuksen jälkeen tapahtuman `todo.created` tai `todo.updated` NATS-subjectiin `todos.<namespace>.events`.

Tapahtuma sisältää yksilöllisen viestitunnisteen sekä tehtävän tiedot. Broadcaster välittää tapahtuman ulkoiseen palveluun.

[Broadcaster ja testaustulokset](../broadcaster/README.md)
