---
title: Sunucunuzu Akeed’e Bağlama (Sunucu API’si)
description: Web sitenizden veya sisteminizden kapıda ödeme siparişlerini tek bir HTTPS isteğiyle Akeed’e otomatik olarak gönderin.
order: 6
slug: server-api
---

## Genel Bakış

Sunucu API’si, sisteminizin siparişleri elle eklemek ya da bir dosyadan içe aktarmak yerine oluşturuldukları anda Akeed’e göndermesini sağlar. Bu sayfa mağaza sahibi için yazılmıştır. Entegrasyonu yapacak geliştiricinin İngilizce olan tam kılavuza ihtiyacı vardır.

**Sunucunuz → Akeed’e bir istek → WhatsApp onay mesajı → sonuç panelde**

[Geliştiriciler için tam kılavuzu açın (İngilizce)](/en/docs/server-api)

> [!INFO]
> API bağımsız hesaplarda kullanılabilir. Shopify mağazalarının buna ihtiyacı yoktur, çünkü siparişleri otomatik olarak gelir. [Akeed’i Shopify Olmadan Kullanma](/docs/standalone-platform) kılavuzuna bakın.

## Bu API Kimler İçin

- Kendi web sitesi veya kendi sipariş sistemi olan bir mağaza.
- Sipariş alan ve kargoya vermeden önce onaylamak isteyen bir kargo şirketi veya şirket içi sistem.
- Bir sunucudan HTTPS isteği gönderebilen her sistem.

Geliştiriciniz yoksa [Toplu Sipariş İçe Aktarma](/docs/bulk-order-import) özelliğini kullanın ya da siparişleri panelden ekleyin.

## Entegrasyon Adımları

1. **Bir API anahtarı oluşturun.** **Ayarlar → API anahtarları** bölümünde **Anahtar oluştur** seçeneğini seçin. Anahtar yalnızca bir kez gösterilir: hemen kopyalayın.
2. **Anahtarı ve gönderim adresini geliştiriciye iletin.** Adres aynı ekranda, **Siparişleri şuraya gönderin** başlığı altında yer alır. Anahtarı herkese açık bir sohbetle değil, güvenli bir kanalla iletin.
3. **Geliştirici entegrasyonu** [tam kılavuzu](/en/docs/server-api) izleyerek yapar. İlk sipariş birkaç dakika sürer.
4. **Sonucu takip edin.** Her sipariş diğer siparişlerinizle birlikte **Onaylar** listesinde görünür.

> [!WARNING]
> Anahtar yalnızca sunucunuza ait bir gizli bilgidir. Onu bir web sayfasına, bir mobil uygulamaya veya bir müşterinin görebileceği herhangi bir yere koymayın. Anahtara sahip olan herkes mağazanıza sipariş gönderebilir. Anahtarın sızdığını düşünüyorsanız **Ayarlar → API anahtarları** bölümünden iptal edin ve yeni bir anahtar oluşturun.

## Bilmeniz Gerekenler

| Soru | Yanıt |
| --- | --- |
| Mesaj, sipariş alınır alınmaz mı gönderilir? | Akeed önce siparişi kaydeder, ardından mesajı sessiz saatler ve gönderim gecikmesi gibi ayarlarınıza göre gönderir. |
| Önceden ödenmiş siparişlere ne olur? | Kaydedilir ve panelde görünür, ancak müşteriye mesaj gönderilmez ve kredi kullanılmaz. |
| Sistem aynı siparişi iki kez gönderirse ne olur? | İkinci bir sipariş oluşturulmaz, ikinci bir mesaj gönderilmez ve kredi iki kez düşülmez. |
| Bir sipariş API’den değiştirilebilir veya iptal edilebilir mi? | Hayır. API yalnızca sipariş oluşturur. |
| Müşterinin yanıtı nerede görülür? | Paneldeki **Onaylar** listesinde. Akeed sunucunuza bildirim göndermez. |
| Bir test modu var mı? | Hayır. Her kapıda ödeme siparişi gerçek bir mesaj gönderir ve bir kredi kullanır. Önce kendi telefon numaranızla deneyin. |
| Siparişlerin alınmasını ne durdurur? | Bakiyenin bitmesi, ayarlarda otomatik onayın kapatılması ya da anahtarın iptal edilmesi. |

## Sorun Olursa

Akeed’in her yanıtı `correlationId` adlı bir referans numarası içerir. Geliştiriciden bu numarayı, isteğin zamanı ve hata koduyla birlikte [destek](/support) ekibine iletmesini isteyin. Anahtarı kimseyle, destek ekibiyle bile paylaşmayın.

## İlgili Kılavuzlar

- [Geliştiriciler için tam kılavuz (İngilizce)](/en/docs/server-api)
- [Akeed’i Shopify Olmadan Kullanma](/docs/standalone-platform)
- [Toplu Sipariş İçe Aktarma](/docs/bulk-order-import)
- [Sipariş Onayı](/docs/order-confirmation)
