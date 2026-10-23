---
title: Otomasyon Kuralları
description: Gönderim zamanlamasını, hatırlatmaları, yanıt yok işaretlemesini ve sessiz saatleri kapıda ödeme operasyonlarınıza göre ayarlayın.
order: 8
slug: automation-rules
---

## Genel Bakış

Otomasyon Kuralları, Akeed’in onay mesajlarını **ne zaman** göndereceğini ve yanıt vermeyen müşterileri **nasıl** ele alacağını belirler.

Bu ayarlar hız, müşteri deneyimi ve sevkiyat riski arasında denge kurmanızı sağlar.

## Bu Kurallar Neden Önemli

İyi zamanlama yanıtların kalitesini artırır.

- Çok erken veya çok geç gönderim → daha düşük yanıt oranı.
- Hatırlatma yok → daha fazla yanıt yok siparişi.
- Çok erken yanıt yok işaretlemesi → onaylanacak siparişleri iptal edebilirsiniz.

Amaç basit: doğru zamanda gönderin, bir kez hatırlatın, net kurallarla yanıt yok olarak işaretleyin.

## Kural 1: İlk Gönderim Gecikmesi

Akeed’in ilk WhatsApp onayını göndermeden önce ne kadar bekleyeceğini belirler.

### Önerilen varsayılan

- Çoğu mağaza için **0 ile 15 dakika** ile başlayın.

### Daha uzun gecikme ne zaman kullanılır

- Sipariş düzenlemeleri için kısa bir pay bırakmanız gerekiyorsa.
- Ödeme sayfasındaki yoğun anlarda anında gönderimden kaçınmak istiyorsanız.

> [!INFO]
> Çok uzun ilk gönderim gecikmeleri genellikle onay performansını düşürür, çünkü müşterinin satın alma isteği zamanla soğur.

## Kural 2: Hatırlatma

Açıksa Akeed, yanıt vermeyen müşterilere bir hatırlatma gönderir.

### Önerilen varsayılan

- Hatırlatmayı **açık** tutun.
- İlk gönderimden **6 saat** sonrasıyla başlayın. Varsayılan değer budur.

### Neden işe yarar

- Müşteriler ilk mesajı sıklıkla gözden kaçırır.
- Tek bir hatırlatma, onayların kayda değer bir kısmını geri kazandırır.

## Kural 3: Yanıt Yok İşaretlemesi

Bu kural, müşteri ayarladığınız süreden sonra hâlâ yanıt vermemişse siparişi **Yanıt yok** olarak işaretler.

### Önerilen varsayılan

- Hatırlatmadan **24 saat** sonrasıyla başlayın. Varsayılan değer budur.
- İşaretleme süresini hatırlatma süresinden uzun tutun.

### Operasyonda kullanımı

Yanıt yok listesini operasyon ekibi için bir inceleme kuyruğu olarak kullanın.

- Yüksek tutarlı siparişlerde elle yeniden deneyin.
- Güvenilirliği düşük siparişleri politikanıza göre iptal edin.

> [!WARNING]
> İşaretleme süresi çok kısa tutulursa, daha sonra yanıt verecek geçerli siparişleri engelleyebilirsiniz.

### Yanıtsız siparişleri otomatik iptal etme

Bir sipariş **Yanıt yok** durumuna geldiğinde Akeed’in onu mağazanızda iptal etmesine izin verebilirsiniz. Ayarlarda **Zamanlama ve takip** bölümünden açana kadar kapalıdır ve yanıtsız sipariş uyarısını gerektirir. İptal, sipariş **Yanıt yok** durumuna geldiği anda yapılır, yani yanıt yok süreniz aynı zamanda iptal sürenizdir.

Akeed bir siparişi yalnızca bunların hepsi sağlandığında iptal eder:

- Onay mesajı ve gerekiyorsa hatırlatma teslim edildi.
- Müşteri hiçbir şekilde yazmadı.
- Siparişi **Otomatik iptal etme** ile hariç tutmadınız.
- Mağaza siparişi hâlâ ödenmemiş ve gönderilmemiş gösteriyor.

Akeed bir mesajı gönderemez veya teslim edemezse, örneğin planınız ya da kredileriniz bittiği için, iptal duraklatılır. Akeed kendi gönderim sınırları yüzünden hiçbir siparişi iptal etmez.

Shopify’da ürünlerin stoğa geri eklenip eklenmeyeceğini ve Shopify’ın müşteriyi bilgilendirip bilgilendirmeyeceğini siz seçersiniz. WooCommerce ve EasyOrders mağazanızın kendi ayarlarını izler. İptal edilen siparişte **Onay denemelerinden sonra yanıt yok** yazar. Müşteri bundan sonra yazarsa, mesajı okuyabilmeniz için sipariş **İşlem bekleyenler** bölümüne taşınır.

Ayarı kapatmak, mağazanıza henüz ulaşmamış tüm iptalleri durdurur.

## Kural 4: Sessiz Saatler

Sessiz saatler, belirli yerel saatlerde (örneğin gece boyunca) gönderim yapılmasını önler.

### Önerilen kullanım

- Sessiz saatler varsayılan olarak saat diliminizde 22:00 ile 09:00 arasında açıktır. Yalnızca müşterileriniz gece mesaj bekliyorsa kapatın.
- Başlangıç ve bitiş saatlerini pazarınızdaki alışkanlıklara göre belirleyin.

### Önemli

Mesajlar sessiz saatler bitene kadar ertelenir.

Ekibiniz sabahları çok sayıda beklemede veya yanıt yok durumu görüyorsa, sessiz saatlerin gönderimleri beklenenden geç bir saate itip itmediğini kontrol edin.

## Kural 5: Saat Dilimi

Saat dilimi, sessiz saatlerin nasıl uygulanacağını belirler.

Saat dilimini ana operasyon ekibinizin ve müşterilerinizin kullandığı saat dilimine ayarlayın.

## Pratik Yapılandırma Örnekleri

| Mağaza Tipi | İlk Gecikme | Hatırlatma | Yanıt Yok İşaretleme | Sessiz Saatler |
| --- | ---: | ---: | ---: | --- |
| Hızlı sevkiyat yapan mağaza | 0–10 dk | 60 dk | 240 dk | İsteğe bağlı |
| Dengeli varsayılan kurulum | 0 dk | 360 dk | Hatırlatmadan sonra 1440 dk | 22:00–09:00 |

Bunları başlangıç noktası olarak kullanın, ardından yanıt ve onay oranlarınıza göre her hafta ince ayar yapın.

## Sık Yapılan Hatalar

| Hata | Daha İyi Yaklaşım |
| --- | --- |
| Hatırlatmayı ilk günden kapatmak | Bir hatırlatmayı açık tutun ve önce etkisini ölçün. |
| Yanıt yok işaretlemesini ilk gönderime çok yakın ayarlamak | İlk gönderim, hatırlatma ve işaretleme arasında yanıt için yeterli süre bırakın. |
| Sessiz saatleri yanlış saat dilimiyle açmak | Kurulum değişikliklerinden sonra saat dilimini yeniden kontrol edin. |
| Kuralları her gün sürekli değiştirmek | Değişiklikleri kontrollü haftalık döngülerle yapın ve sonuçları karşılaştırın. |

## Sorun Giderme

### Kural değişikliklerinden sonra yanıt oranı düştü

- Önceki kararlı zamanlamaya geri dönün.
- Sessiz saatlerin artık en yoğun yanıt saatlerini engelleyip engellemediğini kontrol edin.
- Zamanlamada her seferinde tek bir değişiklik yapın.

### Yanıt yok durumunda çok fazla sipariş var

- Yanıt yok işaretleme süresini uzatın.
- Hatırlatmanın açık olduğundan emin olun.
- Mesajlar çok geç gidiyorsa ilk gönderim gecikmesini azaltın.

### Müşteriler mesajların saatinden şikâyet ediyor

- Sessiz saatleri açın.
- Gönderim saatlerini yerel saat dilimine göre gündüze kaydırın.

## SSS

### Her mağaza aynı otomasyon kurallarını mı kullanmalı?

Hayır. Kuralları kendi sipariş davranışınıza, müşteri kitlenizin alışkanlıklarına ve destek kapasitenize göre ayarlayın.

### Tek bir hatırlatma yeterli mi?

Çoğu mağaza için evet. Tek bir hatırlatma, spam izlenimi yaratmadan geri kazanılabilecek yanıtların çoğunu yakalar.

### En iyi yanıt yok işaretleme süresi nedir?

Herkese uyan bir değer yoktur. Hatırlatmadan 24 saat sonrasıyla başlayın, ardından gerçek yanıt örüntülerine göre ayarlayın.

### Kurallarımın işe yarayıp yaramadığını nereden kontrol edebilirim?

Panelinizde yanıt oranını, onay oranını, yanıt yok hacmini ve başarısız gönderimleri izleyin.

Ayrıca bakın: [Sipariş Onayı](/docs/order-confirmation)
