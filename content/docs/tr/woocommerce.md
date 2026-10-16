---
title: WooCommerce’i Bağlama
description: WooCommerce mağazanızı bağlayın; Akeed yeni kapıda ödeme siparişlerini WhatsApp üzerinden onaylasın ve müşterinin yanıtını siparişe kaydetsin.
order: 3
slug: woocommerce
---

## Genel Bakış

WooCommerce mağazanızı bir kez bağlayın; Akeed her yeni kapıda ödeme siparişini kendiliğinden alır. Siparişi müşteriyle WhatsApp üzerinden onaylar ve yanıtı mağazanızdaki siparişe kaydeder.

Bir WordPress eklentisi yüklemeniz ya da herhangi bir anahtar kopyalamanız gerekmez. Bağlantıyı kendi mağazanızın içinde onaylarsınız.

> [!INFO]
> Akeed yalnızca kapıda ödeme siparişlerini onaylar. Online ödenen siparişler alınır ve atlanır.

## Başlamadan Önce

Mağazanızda aşağıdakilerin tümü olmalıdır:

- `https://` ile başlayan ve herkese açık internette açılan bir adres.
- **Plain** dışında herhangi bir seçeneğe ayarlanmış kalıcı bağlantılar (WordPress > Settings > Permalinks).
- WooCommerce’in standart **Cash on delivery** ödeme yöntemi.
- Bağlantıyı onaylamak için yönetici (administrator) veya mağaza yöneticisi (shop manager) olan bir WordPress kullanıcısı.

Ayrıca Akeed hesabınızın sahibi veya yöneticisi olmanız gerekir. Bir Akeed hesabı siparişlerini tek bir kaynaktan alır, bu yüzden hesabın başka bir sipariş kaynağı olmamalıdır.

> [!WARNING]
> Akeed her barındırma yapılandırmasıyla veya her eklentiyle çalışacağını garanti edemez. Özel bir ödeme yöntemi, özel bir sipariş durumu ya da siparişlerin gönderilme şeklini değiştiren bir eklenti siparişlerin atlanmasına neden olabilir.

## Mağazanızı Bağlayın

1. **Kayıt olurken WooCommerce’i seçin.** E-posta adresinizi doğruladıktan sonra bağlantı ekranına yönlendirilirsiniz.
2. **Mağazanızın adresini girin.** Müşterilerinizin ziyaret ettiği adresi kullanın, örneğin `https://example.com`. Akeed mağazaya ulaşabildiğini kontrol eder.
3. **Mağazanızda onaylayın.** Mağazanız aynı sekmede açılır. Yönetici veya mağaza yöneticisi olarak giriş yapın, ardından **Approve** seçeneğini seçin. Mağazanız Akeed’e okuma ve yazma erişimi vermenizi ister.
4. **Bağlantının tamamlanmasını bekleyin.** Akeed’e geri dönersiniz ve sayfa kendiliğinden güncellenir.
5. **Ücretsiz test mesajını gönderin.** Müşterilerin ne gördüğünü görmeniz için Akeed kendi WhatsApp numaranıza bir test onayı gönderir. Ardından mağazanız kurulmuş olur.

Akeed bu erişimi yalnızca şunlar için kullanır:

- yeni siparişlerinizi almak,
- mağazanızda ihtiyaç duyduğu iki sipariş bildirimini kurmak,
- müşterinizin yanıtını siparişe kaydetmek.

Mesajlar müşterilerinize Akeed’in WhatsApp numarasından ulaşır. Kendinize ait bir WhatsApp numarasına ihtiyacınız yoktur.

## Akeed’in Mağazanıza Yazdıkları

| Ne olur | WooCommerce siparişinizde |
| --- | --- |
| Müşteri onaylar | Akeed özel bir sipariş notu ekler. Sipariş durumu değişmez. |
| Müşteri iptal eder | Sipariş durumu **Cancelled** olarak değişir. |
| Yanıt yok durumundaki bir siparişi Akeed’den iptal edersiniz | Sipariş durumu **Cancelled** olarak değişir. |
| Müşteri yanıt vermez | Hiçbir şey. Sipariş yalnızca Akeed’de **Yanıt yok** olarak işaretlenir. |

Akeed, WooCommerce’deki bir siparişi hiçbir zaman kendi kendine iptal etmez. Müşteri yanıt vermediğinde ne yapılacağına siz karar verirsiniz.

Bir sipariş iptal edildiğinde WooCommerce, iptal edilen her siparişte yaptığını yapar; örneğin stoğu geri ekler ve iptal e-postasını gönderir.

Akeed yalnızca hâlâ **Processing** veya **On hold** durumundaki bir siparişe yazar. Siparişi zaten tamamladıysanız, iade ettiyseniz veya değiştirdiyseniz Akeed ona dokunmaz.

## Bağlantıyı Sağlıklı Tutun

Bağlantıyı görmek için **Ayarlar**’ı, ardından sipariş kaynağınızı açın:

| Gördüğünüz | Anlamı | Ne yapmalı |
| --- | --- | --- |
| Sipariş bildirimleri **Etkin** | Mağazanız yeni siparişleri Akeed’e gönderiyor. | Hiçbir şey. |
| **Mağazanız tarafından devre dışı bırakıldı** | WooCommerce, art arda birkaç teslimat başarısız olduktan sonra bildirimi kapatır. Yeni siparişler Akeed’e ulaşmaz. | **Sipariş bildirimlerini yeniden etkinleştir** seçeneğini seçin. |
| **Mağazanızda duraklatıldı** | Biri bildirimi WooCommerce’de duraklattı. | WordPress’te WooCommerce > Settings > Advanced > Webhooks altında etkinleştirin. |
| **Mağazanızdan silindi** | Bildirim WooCommerce’de kaldırıldı. | Bağlantıyı kesin, ardından aynı mağazayı yeniden bağlayın. |
| Mağazanız artık Akeed’in erişimini kabul etmiyor | API anahtarı iptal edildi ya da WordPress kullanıcısı artık WooCommerce’i yönetemiyor. | Bağlantıyı kesin, ardından aynı mağazayı yeniden bağlayın. |

**Bağlantıyı kontrol et**, mağazanıza her şeyin hâlâ çalışıp çalışmadığını sorar ve ilgilenilmesi gerekenleri listeler.

> [!WARNING]
> Bir bildirim devre dışıyken ya da mağaza bağlı değilken verilen siparişler Akeed’e sonradan gönderilmez. Bu siparişleri kendiniz onaylayın.

## Bağlantıyı Kesme ve Yeniden Bağlama

Ayarlar’da **WooCommerce bağlantısını kes** seçeneğini seçin. Akeed mağazadan sipariş almayı, bu siparişler için mesaj göndermeyi ve onları güncellemeyi bırakır. Önceki siparişleriniz, sonuçlarınız ve kullanım geçmişiniz saklanır.

Akeed, iki sipariş bildirimini silmesini mağazanızdan ister. Size kalan tek bir iş vardır, çünkü Akeed mağazanızdaki kendi anahtarını iptal edemez:

1. WordPress’te WooCommerce > Settings > Advanced > REST API bölümünü açın.
2. **Akeed** adlı anahtarı bulun ve **Revoke** seçeneğini seçin.
3. Akeed bildirimlerin silinmediğini söylerse WooCommerce > Settings > Advanced > Webhooks bölümünü açın ve adı **Akeed** ile başlayan tüm webhook’ları silin.

Yeniden onay vererek aynı mağazayı istediğiniz zaman yeniden bağlayabilirsiniz. Aynı hesaba farklı bir mağaza ya da farklı bir adresteki aynı mağaza bağlanamaz. Buna ihtiyacınız varsa Akeed destek ekibiyle iletişime geçin.

## Sık Yapılan Hatalar

| Hata | Daha İyi Yaklaşım |
| --- | --- |
| Yönlendirme yapan bir adres girmek | Son adresi, `www` ile ya da olmadan, tarayıcıda göründüğü şekliyle tam olarak girin. |
| WooCommerce’i yönetemeyen bir kullanıcıyla onaylamak | Yönetici veya mağaza yöneticisi olarak giriş yapın. |
| WooCommerce’deki Akeed webhook’larını düzenlemek | Onları olduğu gibi bırakın. Biri değiştirildiyse bağlantıyı kesip yeniden bağlayın. |
| Kaçırılan siparişlerin sorun giderildikten sonra gelmesini beklemek | Bu siparişler içe aktarılmaz. Onları elle onaylayın. |

## Sorun Giderme

### Akeed WooCommerce REST API’sini bulamadı

WordPress’te Settings > Permalinks bölümünü açın, **Plain** dışında herhangi bir seçeneği seçin ve WooCommerce’in etkin ve güncel olduğundan emin olun.

### Mağazam API anahtarını kabul etmedi

Bazı barındırma yapılandırmaları `Authorization` başlığını WordPress’e ulaşmadan önce kaldırır. Barındırma sağlayıcınızdan buna izin vermesini isteyin. Ardından WooCommerce > Settings > Advanced > REST API altında kullanılmayan anahtarı silin ve yeniden bağlanın.

### Mağazam farklı bir adres bildiriyor

Adresi WordPress’te ayarlandığı şekliyle tam olarak girin. Mağazanız bağlandıktan sonra yeni bir adrese taşındıysa Akeed destek ekibiyle iletişime geçin.

### Siparişler gelmiyor

Ayarlar’ı açın ve sipariş bildirimlerine bakın. Biri devre dışıysa yeniden etkinleştirin. Kontrol, barındırmanızda, sertifikanızda veya alan adınızda bir sorun bulursa bunu barındırma sağlayıcınız düzeltebilir.

### Bir sipariş onaylanmadı

Ödeme yönteminin kapıda ödeme olduğunu, siparişin bağlantıdan sonra verilmiş yeni bir sipariş olduğunu ve müşterinin telefon numarasının geçerli olduğunu kontrol edin.

## SSS

### Bir WordPress eklentisine ihtiyacım var mı?

Hayır. Akeed, WooCommerce’in kendi onay ekranı üzerinden bağlanır.

### Kendi WhatsApp Business numaram gerekli mi?

Hayır. Mesajlar Akeed’in WhatsApp numarasından gönderilir.

### Akeed eski siparişlerimi içe aktarır mı?

Hayır. Akeed, mağaza bağlandıktan sonra verilen siparişleri onaylar.

### Nasıl ödeme yaparım?

Shopify kullanmayan her hesap gibi kredi ile. [Akeed’i Shopify Olmadan Kullanma](/docs/standalone-platform#krediler-nasıl-çalışır) kılavuzuna bakın.

### Bir hesaba iki mağaza bağlayabilir miyim?

Hayır. Bir hesabın tek bir sipariş kaynağı vardır.

## İlgili Kılavuzlar

- [Başlarken](/docs/getting-started)
- [Sipariş Onayı](/docs/order-confirmation)
- [Otomasyon Kuralları](/docs/automation-rules)
- [Sorun Giderme](/docs/troubleshooting)
