---
title: Başlarken
description: Akeed’i Shopify’da, bağlı bir WooCommerce veya EasyOrders mağazasıyla ya da tek başına kurun ve ilk kapıda ödeme onay mesajınızı gönderin.
order: 1
slug: getting-started
---

## Genel Bakış

**Akeed — satıcılar için kapıda ödeme onay altyapısı.** Akeed, kapıda ödemeli siparişleri kargoya vermeden önce WhatsApp üzerinden onaylamanıza yardımcı olur. Uygun her kapıda ödeme siparişi için Akeed bir onay mesajı gönderir ve müşteri yanıt verdiğinde panelinizi günceller.

Akeed üç şekilde çalışır. İlk kurulumu yaparken bu kılavuzu kullanın.

| Durumunuz… | Kullanın | Siparişler nasıl gelir | Nasıl ödersiniz |
| --- | --- | --- | --- |
| Shopify mağazanız varsa | [Yol A: Shopify](#yol-a-shopify) | Mağazanızdan otomatik olarak. | Shopify tarafından faturalanan aylık bir plan. |
| WooCommerce veya EasyOrders mağazanız varsa | [WooCommerce’i bağlama](/docs/woocommerce) veya [EasyOrders’ı bağlama](/docs/easyorders) | Mağazanızdan otomatik olarak. | Paymob üzerinden satın alınan krediler. |
| Başka bir yerde satış yapıyor ya da bir tablo üzerinden çalışıyorsanız | [Yol B: Kendi mağazanız](#yol-b-kendi-mağazanız-shopify-olmadan) | Siparişleri tek tek eklersiniz, bir dosya içe aktarırsınız ya da kendi sunucunuzdan gönderirsiniz. | Paymob üzerinden satın alınan krediler. |

> [!INFO]
> Akeed, kapıda ödemeli siparişlerin onayı için tasarlanmıştır. Online ödemesi yapılmış siparişler için onay mesajı göndermez.

## Yol A: Shopify

### Başlamadan Önce

Şunlara sahip olduğunuzdan emin olun:

- Shopify mağaza yöneticinize erişim.
- Uygulama yükleme ve uygulama aboneliklerini onaylama yetkisi.
- En az bir yeni kapıda ödeme siparişi ya da test onayı için kullanabileceğiniz bir telefon numarası.

Standart kurulum için kendi WhatsApp numaranızı bağlamanız gerekmez. Akeed mesajları resmi WhatsApp altyapısı üzerinden gönderir.

### Adım 1: Akeed’i Yükleyin

Akeed’i Shopify’dan yükleyin ve uygulamayı Shopify yöneticinizden açın. Akeed’i ilk kez açıyorsanız kurulum adımlarında size yol gösterilir.

Yükleme sırasında Shopify sizden uygulama izinlerini onaylamanızı isteyebilir. Bu izinler Akeed’in sipariş ayrıntılarını okumasını, kapıda ödeme siparişlerini tespit etmesini ve onaydan sonra Shopify siparişlerini güncellemesini sağlar.

### Adım 2: Mağaza Kurulumunu Tamamlayın

Kurulum ekranında mağaza ayarlarınızı gözden geçirin:

| Ayar | Anlamı |
| --- | --- |
| Mağaza adı | Uygulama kurulumunda ve mesaj önizlemelerinde gösterilen ad. |
| Uygulama dili | Akeed içinde kullanılan dil. |
| Varsayılan mesaj dili | Akeed’in müşterilere gönderdiği WhatsApp mesajlarında kullandığı dil. |
| Otomatik onay | Yeni ve uygun kapıda ödeme siparişlerinin otomatik olarak onaya gönderilip gönderilmeyeceği. |

Çoğu mağaza için otomatik onayı açık tutun. Böylece yeni bir kapıda ödeme siparişi oluşturulduğunda Akeed onay mesajlarını otomatik olarak gönderir.

### Adım 3: Bir Plan Seçin

Aylık beklenen kapıda ödeme onay hacminize uygun planı seçin.

| Plan | Dahil Onaylar | En Uygun Olduğu Durum |
| --- | ---: | --- |
| Starter | 30 | Akeed’i ilk kez deneyenler. |
| Basic | 300 | Kapıda ödeme siparişlerini düzenli olarak onaylayan küçük mağazalar. |
| Pro | 1.000 | Günlük kapıda ödeme hacmi ve otomasyon ihtiyacı olan mağazalar. |
| Scale | 2.500 | Daha yüksek hacimli kapıda ödeme operasyonları. |

> [!WARNING]
> Planınıza dahil onay sınırına ulaşıldığında, planınız yenilenene veya daha üst bir plana geçene kadar yeni WhatsApp gönderimleri durabilir.

### Adım 4: Test Onayı Gönderin

Kurulumdan sonra Akeed panelini açın ve kendi telefon numaranıza bir test onayı gönderin.

Testle şunları doğrulayın:

- WhatsApp mesajı teslim ediliyor.
- Onayla ve iptal et düğmeleri çalışıyor.
- Sonuç Akeed panelinizde görünüyor.

Test onayları, gerçek siparişler gelmeye başlamadan önce müşteri deneyimini anlamanıza yardımcı olur.

### Adım 5: Panelinizi İnceleyin

Panel, sipariş onay etkinliğinizi gösterir. Örneğin:

- Onaylanan siparişler.
- İptal edilen siparişler.
- Müşteri yanıtı bekleyen siparişler.
- Başarısız veya engellenen gönderimler.
- Gönderilen hatırlatmalar.
- Mevcut plan kullanımı.

Sevkiyat ekibinizin hangi kapıda ödeme siparişlerinin kargoya hazır olduğunu bilmesi için paneli düzenli olarak kontrol edin.

## Yol B: Kendi Mağazanız (Shopify Olmadan)

Shopify kullanmıyorsanız bu yolu izleyin. Tüm ayrıntılar için [Akeed’i Shopify Olmadan Kullanma](/docs/standalone-platform) kılavuzuna bakın. Mağazanız WooCommerce veya EasyOrders üzerinde çalışıyorsa kayıt olurken bunu seçin ve bunun yerine [WooCommerce’i bağlama](/docs/woocommerce) veya [EasyOrders’ı bağlama](/docs/easyorders) kılavuzunu izleyin: siparişleriniz böylece kendiliğinden gelir.

### Adım 1: Hesabınızı Oluşturun

Kayıt olun ve e-posta adresinizi doğrulayın.

### Adım 2: Mağazanızı Kurun

Mağaza adınızı ve kendi WhatsApp numaranızı girin. Müşteriler için bir WhatsApp numarası bağlamanız gerekmez. Akeed mesajları kendi resmi numarasından gönderir.

### Adım 3: Mesajı Deneyin

Akeed kendi numaranıza ücretsiz bir test onayı gönderir. Mesajın geldiğini ve onayla ile iptal et düğmelerinin çalıştığını kontrol edin. Bu adımı atlayabilirsiniz.

### Adım 4: Siparişlerinizi Ekleyin

- **Tek sipariş:** paneldeki **Siparişi doğrula** seçeneğini kullanın.
- **Çok sayıda sipariş:** bir CSV veya Excel dosyası getirmek için **Dosyadan içe aktar** seçeneğini kullanın. [Toplu Sipariş İçe Aktarma](/docs/bulk-order-import) kılavuzuna bakın.

### Adım 5: Kredinizi Hazır Tutun

30 ücretsiz krediyle başlarsınız. Bir kredi bir WhatsApp mesajıdır; bir hatırlatma bir kredi daha harcar. Daha fazla kredi almak için **Faturalandırma ve krediler** bölümünü açın ve Paymob üzerinden kartla veya Vodafone Cash ile ödeyin.

> [!WARNING]
> Krediniz bittiğinde, yeni kredi alana kadar yeni onaylar durur.

## Sık Yapılan Hatalar

| Hata | Nasıl Önlenir |
| --- | --- |
| Otomatik onayı yanlışlıkla kapatmak | Tüm yeni kapıda ödeme onaylarını duraklatmak istemiyorsanız otomatik onayı açık tutun. |
| Müşteri yanıt vermeden kargoya vermek | Mümkün olduğunca onaylandı durumunu bekleyin. |
| Plan kullanımını veya kredi bakiyesini göz ardı etmek | Gönderimlerin beklenmedik şekilde durmaması için kullanım çubuğunuzu (Shopify) veya kredi bakiyenizi (bağımsız hesap) takip edin. |
| Çok uzun gecikmeler ayarlamak | İlk gönderim ve hatırlatma gecikmelerini sevkiyat akışınıza uygun tutun. |

## Sorun Giderme

### Bir kapıda ödeme siparişi onaylanmadı

Otomatik onayın açık olduğunu ve siparişin ödeme yönteminin gerçekten kapıda ödeme olduğunu kontrol edin.

### Test mesajı gelmedi

Telefon numarasının geçerli olduğundan ve ülke kodunu içerdiğinden emin olun. Sorun devam ederse destek ekibiyle iletişime geçmeden önce başka bir telefon numarası deneyin.

### Yeni gönderimler durdu

Shopify’da plan kullanımınızı kontrol edin. Planınıza dahil onaylar bittiyse planınızı yükseltin ya da bir sonraki fatura dönemini bekleyin. Bağımsız bir hesapta kredi bakiyenizi kontrol edin ve bakiye sıfırsa kredi yükleyin.

## SSS

### Akeed her siparişi onaylar mı?

Hayır. Akeed kapıda ödemeli siparişlere odaklanır. Online ödemesi yapılmış siparişler bu akış üzerinden otomatik olarak onaylanmaz.

### Akeed’i kullanmak için Shopify gerekli mi?

Hayır. Shopify mağazaları Akeed’i Shopify’dan yükler. WooCommerce ve EasyOrders mağazaları birkaç adımda bağlanır. Diğer herkes bağımsız bir hesap kullanabilir. [Akeed’i Shopify Olmadan Kullanma](/docs/standalone-platform) kılavuzuna bakın.

### Kendi WhatsApp Business hesabım gerekli mi?

Standart kurulum için gerekli değil. Akeed onay mesajlarını kendi resmi WhatsApp altyapısıyla gönderebilir.

### Mesaj dilini daha sonra değiştirebilir miyim?

Evet. Varsayılan mesaj dilini ayarlardan değiştirebilirsiniz.

### Müşteri onayladıktan sonra ne yapmalıyım?

Siparişin sevkiyata hazır olup olmadığına karar vermek için paneldeki durumu kullanın. Onaylanmış kapıda ödeme siparişlerini kargoya vermek, müşterinin yanıt vermediği siparişlere göre daha güvenlidir.
