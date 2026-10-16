---
title: EasyOrders’ı Bağlama
description: EasyOrders mağazanızı bağlayın; Akeed yeni kapıda ödeme siparişlerini WhatsApp üzerinden onaylasın ve sipariş durumunu müşterinin yanıtına göre güncellesin.
order: 4
slug: easyorders
---

## Genel Bakış

EasyOrders mağazanızı bir kez bağlayın; Akeed her yeni kapıda ödeme siparişini kendiliğinden alır. Siparişi müşteriyle WhatsApp üzerinden onaylar ve siparişin EasyOrders’daki durumunu günceller.

Hiçbir anahtar kopyalamanız gerekmez. Bağlantıyı EasyOrders içinde onaylarsınız.

> [!INFO]
> Akeed yalnızca kapıda ödeme siparişlerini onaylar. Başka bir ödeme yöntemiyle verilen siparişler alınır ve atlanır.

## Başlamadan Önce

- Akeed hesabınızın sahibi veya yöneticisisiniz.
- EasyOrders mağazanız etkin.
- Akeed hesabınızın başka bir sipariş kaynağı yok. Bir hesap siparişlerini tek bir kaynaktan alır.

## Mağazanızı Bağlayın

1. **Kayıt olurken EasyOrders’ı seçin.** E-posta adresinizi doğruladıktan sonra bağlantı ekranına yönlendirilirsiniz.
2. **EasyOrders’ı bağla seçeneğini seçin.** EasyOrders yeni bir sekmede açılır. Bağlamak istediğiniz mağazaya giriş yapın, ardından **Accept** seçeneğini seçin.
3. **Akeed’e geri dönün.** Bağlantı hazır olduğunda sayfa kendiliğinden güncellenir.
4. **Mağazanızın ülkesini ve para birimini seçin.** EasyOrders sipariş tutarlarını para birimi olmadan, telefon numaralarını ise ülke kodu olmadan gönderir; bu yüzden Akeed’in müşterilerinize doğru mesaj gönderebilmesi için ikisine de ihtiyacı vardır.
5. **Ücretsiz test mesajını gönderin.** Akeed kendi WhatsApp numaranıza bir test onayı gönderir. Ardından mağazanız kurulmuş olur.

Akeed, EasyOrders’dan yalnızca iki izin ister:

- yeni siparişlerinizi okumak,
- müşteriniz onayladığında veya iptal ettiğinde siparişin durumunu güncellemek.

Mesajlar müşterilerinize Akeed’in WhatsApp numarasından ulaşır. Kendinize ait bir WhatsApp numarasına ihtiyacınız yoktur.

> [!WARNING]
> Hem müşteri telefonunun ülkesini hem de mağaza para birimini seçmeden siparişler onaylanmaz.

## Akeed’in Mağazanıza Yazdıkları

| Ne olur | EasyOrders’da |
| --- | --- |
| Müşteri onaylar | Sipariş durumu **confirmed** olarak değişir. |
| Müşteri iptal eder | Sipariş durumu **canceled** olarak değişir. |
| Yanıt yok durumundaki bir siparişi Akeed’den iptal edersiniz | Sipariş durumu **canceled** olarak değişir. |
| Müşteri yanıt vermez | Hiçbir şey. Sipariş yalnızca Akeed’de **Yanıt yok** olarak işaretlenir. |

Akeed, EasyOrders’daki bir siparişi hiçbir zaman kendi kendine iptal etmez. Ayrıca yalnızca hâlâ beklemede olan bir siparişi günceller: siparişin durumunu zaten değiştirdiyseniz Akeed ona dokunmaz.

## Bağlantıyı Sağlıklı Tutun

Bağlantıyı görmek için **Ayarlar**’ı, ardından sipariş kaynağınızı açın.

| Gördüğünüz | Anlamı | Ne yapmalı |
| --- | --- | --- |
| EasyOrders mağazanız etkin değil | EasyOrders mağazayı etkin değil veya ödemesi gecikmiş olarak bildiriyor. Siparişler Akeed’e ulaşmaz. | Mağazayı EasyOrders’da yeniden etkinleştirin. |
| EasyOrders artık Akeed’in erişimini kabul etmiyor | API anahtarı EasyOrders’da kaldırıldı. | Bağlantıyı kesin, ardından aynı mağazayı yeniden bağlayın. |
| Webhook gizli anahtarı eşleşmediği için siparişler reddedildi | Akeed webhook’ları EasyOrders’da silinip yeniden oluşturuldu. | **Siparişler reddediliyor mu? Webhook gizli anahtarlarını düzeltin** bölümünü açın ve **Sıfırla ve yeniden öğren** seçeneğini seçin. |

Akeed iki webhook’u kendisi güvence altına alır: ilk siparişinizi EasyOrders ile doğrular, ardından EasyOrders’ın bu siparişle birlikte gönderdiği gizli anahtarı saklar. Sizin kopyalamanız gereken bir şey yoktur.

EasyOrders’da **Akeed** adlı tam olarak bir sipariş webhook’u ve bir sipariş durumu webhook’u bulundurun. Bir adres iki kez görünüyorsa fazla olanı silin.

> [!WARNING]
> Mağaza bağlı değilken veya etkin değilken verilen siparişler Akeed’e sonradan gönderilmez. Bu siparişleri kendiniz onaylayın.

## Bağlantıyı Kesme ve Yeniden Bağlama

Ayarlar’da **EasyOrders bağlantısını kes** seçeneğini seçin. Akeed mağazadan sipariş almayı, bu siparişler için mesaj göndermeyi ve durumlarını güncellemeyi bırakır. Önceki siparişleriniz, sonuçlarınız ve kullanım geçmişiniz saklanır.

Akeed, oluşturduğu webhook’ları silmesini EasyOrders’dan ister. API anahtarı ise siz silene kadar EasyOrders’da kalır:

1. EasyOrders’da Settings > Public API bölümünü açın.
2. **Akeed** adlı API anahtarını silin.
3. Akeed webhook’ların silinmediğini söylerse Webhooks altında **Akeed** adlı tüm webhook’ları silin.

EasyOrders’da yeniden onay vererek aynı mağazayı istediğiniz zaman yeniden bağlayabilirsiniz. Aynı hesaba farklı bir mağaza bağlanamaz. Buna ihtiyacınız varsa Akeed destek ekibiyle iletişime geçin.

## Sık Yapılan Hatalar

| Hata | Daha İyi Yaklaşım |
| --- | --- |
| Ülke ve para birimini atlamak | İkisini de seçin. Bunlar olmadan siparişler onaylanmaz. |
| Yeniden bağlanırken başka bir EasyOrders mağazasına giriş yapmak | Daha önce bağlı olan mağazaya giriş yapın. |
| Akeed webhook’larını “yenilemek” için EasyOrders’da silmek | Onlara dokunmayın. Yeniden oluşturulduysa webhook gizli anahtarlarını Akeed’de sıfırlayın. |
| Kaçırılan siparişlerin sorun giderildikten sonra gelmesini beklemek | Bu siparişler içe aktarılmaz. Onları elle onaylayın. |

## Sorun Giderme

### EasyOrders bağlanmadı

İstek kabul edilmedi ya da süresi doldu. Yeniden başlayın. Accept seçeneğini seçtiyseniz ve yine de başarısız olduysa EasyOrders, Akeed adlı bir API anahtarı ve webhook’lar oluşturmuş olabilir: yeniden denemeden önce bunları Settings > Public API altında silin.

### Bu mağaza zaten başka bir Akeed hesabına bağlı

Bir mağaza tek bir Akeed hesabına bağlanır. Akeed destek ekibiyle iletişime geçin.

### Siparişler gelmiyor

Mağazanın EasyOrders’da etkin olduğunu kontrol edin ve siparişlerin reddedilip reddedilmediğini görmek için Ayarlar’da sipariş kaynağınızı açın.

### Bir sipariş onaylanmadı

Ödeme yönteminin kapıda ödeme olduğunu, müşterinin telefon numarasının seçtiğiniz ülke için geçerli olduğunu ve sipariş tutarının sıfırdan büyük olduğunu kontrol edin.

## SSS

### Kendi WhatsApp Business numaram gerekli mi?

Hayır. Mesajlar Akeed’in WhatsApp numarasından gönderilir.

### Akeed eski siparişlerimi içe aktarır mı?

Hayır. Akeed, mağaza bağlandıktan sonra verilen siparişleri onaylar.

### Ülkeyi veya para birimini daha sonra değiştirebilir miyim?

Evet, Ayarlar’daki sipariş kaynağınızdan.

### Nasıl ödeme yaparım?

Shopify kullanmayan her hesap gibi kredi ile. [Akeed’i Shopify Olmadan Kullanma](/docs/standalone-platform#krediler-nasıl-çalışır) kılavuzuna bakın.

## İlgili Kılavuzlar

- [Başlarken](/docs/getting-started)
- [Sipariş Onayı](/docs/order-confirmation)
- [Otomasyon Kuralları](/docs/automation-rules)
- [Sorun Giderme](/docs/troubleshooting)
