---
title: Kargo Bildirimleri
description: Bir Shopify siparişi kargoya verildiğinde tek bir WhatsApp mesajı gönderin ve müşterinin yanıtına göre işlem yapın.
order: 8
slug: shipping-notifications
---

## Genel Bakış

Kapıda ödemeli bir siparişi kargoya verdiğinizde Akeed müşteriye tek bir WhatsApp mesajı gönderebilir. Mesaj siparişin yolda olduğunu söyler, müşteriden tutarı nakit olarak hazır bulundurmasını ve kurye için telefonunu açık tutmasını ister, eklediyseniz takip numarasını içerir ve üç düğme sunar: **Teslim alacağım**, **Müsait olmayacağım** ve **Adresi değiştir**; ardından bir **Siparişi takip et** düğmesi gelir.

Kargo bildirimleri Shopify mağazaları için kullanılabilir.

## Açın

1. **Ayarlar › Kargo** sayfasını açın.
2. **Sipariş kargoya verildiğinde mesaj gönder** seçeneğini işaretleyin.
3. **Ne zaman gönderilsin** altında bir siparişin neyle kargoya verilmiş sayılacağını seçin.
4. **Kaydet** düğmesine tıklayın.

## Mesaj Ne Zaman Gönderilir

- **Siparişi gönderdiğimde**: Siparişi Shopify’da gönderdiğinizde Akeed mesajı gönderir.
- **Etiket eklediğimde**: Zaten kullandığınız en fazla 10 etiketi ekleyin, örneğin `Shipped`. Bunlardan biri siparişe eklendiğinde Akeed mesajı gönderir.

Her sipariş, ikisinden hangisi önce olursa, tek bir kargo mesajı alır. Akeed’in kendi etiketleri, örneğin `Akeed: Verified`, hiçbir zaman sayılmaz.

Mesaj, Akeed’in aldığı kapıda ödemeli siparişlere gider. Test siparişleri, iptal edilen siparişler ve 30 günden eski siparişler atlanır.

## Kargo Sütunu

Sipariş listeniz **Kargo** sütununda her sipariş için tek bir kelime gösterir. **Durum** sütunu onay sonucunu korur, örneğin **Onaylandı**.

| Gördüğünüz | Anlamı |
| --- | --- |
| **Gönderildi** | Mesaj gitti. İletildi mi, okundu mu görmek için imleci kelimenin üzerine getirin. |
| **Teslim alacak** | Müşteri **Teslim alacağım** düğmesine dokundu. |
| **Müsait değil** | Müşteri **Müsait olmayacağım** düğmesine dokundu. Onunla iletişime geçin. |
| **Adresi değiştir** | Müşteri adresin değiştirilmesini istedi. Onunla iletişime geçin. |
| **WhatsApp iletilemedi** | Müşterinin telefon numarası yok veya numara WhatsApp’ta değil. |
| **Gönderilemedi** | Bir şey mesajı durdurdu. Nedenini görmek için imleci kelimenin üzerine getirin. |
| **Gönderilmedi** | Sipariş 30 günden eski veya iptal edildi. |

**Tamamlandı olarak işaretle** düğmesine tıkladıktan sonra kelime gri kalır. Ne zaman tamamlandığını görmek için imleci üzerine getirin.

Mesajın neden gönderildiğini, takip bilgisini ve müşterinin yanıtını görmek için siparişi açın.

## Mesaj Neden Gönderilmedi

| Neden | Ne yapmalı |
| --- | --- |
| Telefon numarası yok | Müşteriye başka bir yoldan ulaşın. |
| Numara WhatsApp’ta değil | Müşteriyi arayın. |
| Planınızda mesaj kalmadı | Daha büyük bir plan seçin veya bir sonraki dönemi bekleyin. |
| WhatsApp iletemedi | Müşteriyle doğrudan iletişime geçin. |
| Bu dilde henüz kullanılamıyor | O dildeki mesaj WhatsApp onayını bekliyor. |
| Sipariş 30 günden eski | Yapılacak bir şey yok. |
| Sipariş iptal edildi | Yapılacak bir şey yok. |

## Siparişi Takip Et Düğmesi

**Siparişi takip et**, gönderide bir takip bağlantısı varsa ya da Akeed kargo firmasını ve takip numarasını tanıyorsa kargo firmasının takip sayfasını açar. Aksi halde mağaza adınızı, sipariş numarasını, kargo firmasını ve kopyalanacak takip numarasını gösteren kısa bir Akeed sayfası açar. Müşterinin adresini veya telefon numarasını asla göstermez.

## Müşteri Yanıtları

Müşteri **Müsait olmayacağım** veya **Adresi değiştir** düğmesine dokunduğunda sipariş **İşlem bekleyenler** bölümüne geçer. Müşteriyle iletişime geçin, teslimatı kargo firmanızla ayarlayın, ardından siparişin **⋯** menüsünde veya ayrıntılarında **Tamamlandı olarak işaretle** düğmesine tıklayın.

**Teslim alacağım** sizden bir şey gerektirmez. Teşekkür mesajları açıksa Akeed müşteriye yanıtı için teşekkür eder.

Mesajı müşteriye ulaşmayan bir sipariş de **İşlem bekleyenler** bölümünde görünür ve **Kargo** sütununda **WhatsApp iletilemedi** yazar. Müşteriyi arayın, ardından **Tamamlandı olarak işaretle** düğmesine tıklayın.

Bir yanıtı yalnızca mağaza sahibi ve yöneticiler tamamlandı olarak işaretleyebilir.

## Faturalandırma

Her kargo mesajı, bir onay mesajı gibi planınızdan 1 mesaj kullanır. Kendi WhatsApp numaranızdan gönderiyorsanız önce kendi numaranızın mesajları kullanılır. Planınızda mesaj kalmadığında kargo mesajı gönderilmez.
