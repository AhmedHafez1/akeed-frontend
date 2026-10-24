---
title: Akeed’i Shopify Olmadan Kullanma
description: Kapıda ödemeli siparişleri herhangi bir mağazadan WhatsApp üzerinden onaylayın. WooCommerce veya EasyOrders’ı bağlayın, siparişleri elle ekleyin ya da bir dosyadan içe aktarın ve kullanımınızı kredilerle ödeyin.
order: 2
slug: standalone-platform
---

## Genel Bakış

**Akeed — satıcılar için kapıda ödeme onay altyapısı.**

Akeed yalnızca Shopify için değildir. Sosyal medyada, bir pazaryerinde, başka bir platformda ya da bir tablo üzerinden satış yapıyorsanız Akeed’i tek başına kullanabilirsiniz. Kapıda ödemeli siparişlerinizi Akeed’e eklersiniz, Akeed her birini müşteriyle WhatsApp üzerinden onaylar ve siz sonucu panelinizde görürsünüz.

Akeed’in bu kullanım şekline **bağımsız** kullanım denir. Onay akışı Shopify’dakiyle aynıdır. Yalnızca siparişlerin gelme şekli ve ödeme yönteminiz farklıdır.

> [!INFO]
> Akeed kapıda ödemeli siparişlerin onayı içindir. Online olarak ödemesi zaten yapılmış siparişler için onay mesajı göndermez.

## Kimler İçin

- Instagram, Facebook, WhatsApp üzerinden ya da bir çağrı merkeziyle satış yapan satıcılar.
- Siparişlerini bir pazaryerinden, bir web sitesinden ya da Akeed’in henüz bağlanmadığı bir platformdan alan satıcılar.
- Kapıda ödeme siparişlerini Excel veya Google Sheets’te tutan ekipler.

## Sipariş Eklemenin İki Yolu

| Yol | En uygun olduğu durum | Nerede |
| --- | --- | --- |
| Tek bir siparişi doğrulama | Tek bir sipariş ya da hızlı bir test. | Paneldeki **Siparişi doğrula**. |
| Dosyadan içe aktarma | Bir CSV veya Excel dosyasından tek seferde çok sayıda sipariş. | Üst çubuktaki **Dosyadan içe aktar**. [Toplu Sipariş İçe Aktarma](/docs/bulk-order-import) kılavuzuna bakın. |

Her iki yol da aynı WhatsApp onayını gönderir ve aynı hatırlatma ve yanıt yok kurallarını kullanır. İçe aktarılan siparişler diğer tüm siparişlerle birlikte **Onaylar** listenizde görünür.

Kendi web siteniz veya sipariş sisteminiz varsa, siparişleri Akeed’e otomatik olarak da gönderebilir. [Sunucu API’si](/docs/server-api) sayfasına bakın.

## Bunun Yerine Bir Mağaza Bağlayın

Mağazanız WooCommerce veya EasyOrders üzerinde çalışıyorsa siparişleri kendiniz eklemezsiniz. Kayıt olurken platformu seçin, bağlantıyı bir kez onaylayın; her yeni kapıda ödeme siparişi Akeed’e kendiliğinden ulaşır. Akeed müşterinin yanıtını da mağazanızdaki siparişe kaydeder. [WooCommerce’i bağlama](/docs/woocommerce) ve [EasyOrders’ı bağlama](/docs/easyorders) kılavuzlarına bakın.

Bir hesap siparişlerini tek bir kaynaktan alır. Bir mağazaya bağlı hesap **Siparişi doğrula**, dosyadan içe aktarma veya Sunucu API’sini kullanmaz.

> [!INFO]
> Siparişleri yalnızca sahipler ve yöneticiler ekleyebilir veya içe aktarabilir. Görüntüleyiciler siparişleri ve sonuçları görebilir ancak hiçbir şeyi değiştiremez.

## Üç Adımda Kurulum

1. **Hesabınızı oluşturun.** Kayıt olun ve e-posta adresinizi doğrulayın.
2. **Mağazanızı kurun.** Mağaza adınızı ve kendi WhatsApp numaranızı girin. Akeed müşterilere kendi resmi WhatsApp numarasından mesaj gönderir, bu yüzden bir numara bağlamanız gerekmez.
3. **Mesajı deneyin.** Müşterilerin ne gördüğünü görebilmeniz için Akeed kendi numaranıza ücretsiz bir test onayı gönderir. Bu adımı atlayabilirsiniz.

Bundan sonra kullanıma hazırsınız. İlk siparişinizi ekleyin ya da bir dosya içe aktarın.

Yeni bağımsız hesaplar şu varsayılanlarla başlar: ilk mesaj hemen gönderilir, 6 saat sonra bir hatırlatma gider ve yanıt gelmeyen bir sipariş hatırlatmadan 24 saat sonra **Yanıt yok** olarak işaretlenir. Sessiz saatler 22:00 ile 09:00 arasında açıktır, bu yüzden gece hiçbir şey gönderilmez. Bunları Ayarlar’dan değiştirebilirsiniz. [Otomasyon Kuralları](/docs/automation-rules) kılavuzuna bakın.

## Krediler Nasıl Çalışır

Bağımsız hesaplar aylık plan kullanmaz. Kullandığınız kadarını **kredi** ile ödersiniz.

| Kural | Ayrıntılar |
| --- | --- |
| Bir kredi | Müşteriye gönderilen bir WhatsApp mesajı. |
| Hatırlatmalar | Yanıt vermeyen bir müşteriye gönderilen hatırlatma bir kredi daha kullanır. |
| Başarısız gönderimler | WhatsApp bir mesajı kabul etmezse kredi hesabınıza otomatik olarak iade edilir. |
| Başlangıç kredileri | Yeni hesaplar kredi kartı gerekmeden bir kereye mahsus **30 ücretsiz kredi** alır. Bakiyeniz uygulamada gösterilir. |
| Fiyat | Bu kılavuzun yazıldığı tarihte kredi başına **EGP 2,00**. Bir mesaj ve hatırlatması birlikte EGP 4,00 tutar. |
| Abonelik yok | Yalnızca kredi satın aldığınızda ödersiniz. Aylık ücret yoktur. |

### Kredi satın alma

**Faturalandırma ve krediler** bölümünü açın, kaç krediye ihtiyacınız olduğunu seçin ve ödeme adımına geçin. Tek seferde 50’şer artışlarla 100 ile 5.000 arasında kredi satın alabilirsiniz. Örneğin 500 kredi EGP 1.000 tutar. Ödeme, Mısırlı ödeme sağlayıcısı **Paymob** tarafından işlenir ve kartla veya Vodafone Cash ile ödeyebilirsiniz. Fiyatlar Mısır lirası cinsindendir ve değişebilir; geçerli olan her zaman faturalandırma sayfasında gösterilen fiyattır.

Akeed kart veya cüzdan bilgilerinizi hiçbir zaman istemez ve saklamaz. Krediler, Paymob ödemeyi onayladıktan sonra bakiyenize eklenir.

> [!WARNING]
> Bakiyeniz bittiğinde, yeni kredi satın alana kadar yeni onaylar durur. Bakiyenizi takip edin ve büyük bir içe aktarma göndermeden önce kredi yükleyin.

## Shopify’dan Farkları

| | Shopify | WooCommerce veya EasyOrders | Bağımsız |
| --- | --- | --- | --- |
| Siparişler nasıl gelir | Mağazanızdan otomatik olarak. | Mağazanızdan otomatik olarak. | Siz eklersiniz: tek tek, bir dosyadan veya sunucunuzdan. |
| Sonuçlar nerede görünür | Akeed panelinizde ve Shopify siparişinizde. | Akeed panelinizde ve mağazanızdaki siparişte. | Akeed panelinizde. |
| Nasıl ödersiniz | Shopify tarafından faturalanan aylık bir plan. | Paymob üzerinden satın alınan krediler. | Paymob üzerinden satın alınan krediler. |

Kendiniz eklediğiniz siparişlerde Akeed başka bir sistemde hiçbir şeyi değiştirmez. Neyi kargoya vereceğinize karar vermek için panelinizdeki durumu kullanın.

## Sık Yapılan Hatalar

| Hata | Daha İyi Yaklaşım |
| --- | --- |
| Düşük bakiyeyle büyük bir içe aktarma başlatmak | Önce bakiyenizi kontrol edin. Krediniz içe aktarmadaki tüm siparişleri karşılamıyorsa Akeed başlatmaz. |
| Müşteri onaylamadan kargoya vermek | Önce **Onaylandı** durumundaki siparişleri gönderin. |
| Hatırlatmaların kredi kullandığını unutmak | Sipariş başına en fazla iki kredi hesaplayın. |
| Online ödemesi yapılmış siparişlerin onaylanmasını beklemek | Yalnızca kapıda ödeme siparişleri onaylanır. |

## SSS

### Shopify mağazam olması gerekiyor mu?

Hayır. Bağımsız hesaplar Shopify’a veya başka bir platforma ihtiyaç duymaz.

### Akeed Shopify mağazaları için farklı mı?

Shopify mağazaları Akeed’i Shopify’dan yükler, siparişleri otomatik olarak alır ve Shopify tarafından faturalanan aylık bir plan kullanır. Diğer satıcılar bir hesap oluşturur, bir WooCommerce veya EasyOrders mağazası bağlar ya da kendi siparişlerini ekler ve kredi kullanır.

### Kendi WhatsApp Business hesabım gerekli mi?

Hayır. Akeed onayları kendi resmi WhatsApp altyapısı üzerinden gönderir.

### Ekibim tek bir hesabı paylaşabilir mi?

Evet. Sahipler ve yöneticiler sipariş ekleyebilir ve içe aktarabilir. Görüntüleyicilerin yalnızca okuma erişimi vardır.

## İlgili Kılavuzlar

- [WooCommerce’i bağlama](/docs/woocommerce)
- [EasyOrders’ı bağlama](/docs/easyorders)
- [Toplu Sipariş İçe Aktarma](/docs/bulk-order-import)
- [Sunucu API’si](/docs/server-api)
- [Başlarken](/docs/getting-started)
- [Sipariş Onayı](/docs/order-confirmation)
- [Genel SSS](/docs/general-faq)
