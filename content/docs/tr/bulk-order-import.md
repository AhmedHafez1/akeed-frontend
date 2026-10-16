---
title: Toplu Sipariş İçe Aktarma
description: Kapıda ödeme siparişlerini bir CSV veya Excel dosyasından içe aktarın, kontrol edin ve hepsi için WhatsApp onayını tek seferde başlatın.
order: 5
slug: bulk-order-import
---

## Genel Bakış

Toplu Sipariş İçe Aktarma, çok sayıda kapıda ödeme siparişini tek tek eklemek yerine bir tablodan Akeed’e getirmenizi sağlar.

**CSV veya XLSX → Sütunları eşleştirin → Siparişleri önizleyin → İçe aktarın → WhatsApp onayını başlatın**

İçe aktarma tek başına kimseye mesaj göndermez. Müşterilerle yalnızca **Gönder** düğmesine bastığınızda ve kaç mesaj gideceğini ve bunun maliyetini gördükten sonra iletişime geçilir.

Toplu içe aktarma bağımsız hesaplarda kullanılabilir. Akeed’i Shopify’da kullanıyorsanız siparişleriniz zaten otomatik olarak gelir. [Akeed’i Shopify Olmadan Kullanma](/docs/standalone-platform) kılavuzuna bakın.

> [!INFO]
> Siparişleri yalnızca sahipler ve yöneticiler içe aktarabilir. Görüntüleyiciler içe aktarılan siparişleri Onaylar listesinde görebilir ancak içe aktaramaz veya değiştiremez.

## Başlamadan Önce

| Gereksinim | Ayrıntılar |
| --- | --- |
| Dosya türü | `.csv` veya `.xlsx`. Eski `.xls` dosyaları, makro içeren dosyalar ve parolayla korunan dosyalar kabul edilmez. |
| Boyut | Dosya başına en fazla 5 MB ve 100 sipariş. Daha fazla sipariş için dosyayı bölün ve her parçayı ayrı içe aktarın. |
| Başlık satırı | İlk satır sütun adlarını içermelidir. |
| Gerekli sütunlar | Müşteri telefonu, müşteri adı ve sipariş tutarı. |
| Kredi | Onaylamak istediğiniz her sipariş için yeterli kredi. [Akeed’i Shopify Olmadan Kullanma](/docs/standalone-platform) kılavuzuna bakın. |

Hazır bir dosyanız yok mu? Yükleme ekranından Arapça veya İngilizce örnek **CSV** ya da **Excel** şablonunu indirin.

Akeed’in kullanabileceği isteğe bağlı sütunlar: sipariş numarası, para birimi, ödeme yöntemi, sipariş tarihi, şehir, adres ve notlar.

## Adım Adım

### 1. Dosyanızı seçin

Üst çubukta **Dosyadan içe aktar** seçeneğini seçin, ardından dosyanızı sürükleyip bırakın ya da cihazınızdan seçin. Akeed dosyayı okur ve kendiliğinden bir sonraki adıma geçer.

### 2. Sütunları eşleştirin

Akeed sütun adlarınızı, büyük-küçük harf ve noktalama işaretlerini dikkate almadan, Arapça veya İngilizce olarak kendi alanlarıyla otomatik olarak eşleştirir. Eşleşen sütunlar **Eşleşti** olarak işaretlenir. **Bunu kontrol edin** veya **Zorunlu** olarak işaretlenen öğeler için listeden doğru sütunu seçmeniz gerekir. Akeed’in eşleştiremediği sütunlar içe aktarılmaz.

İçe aktarma ayarlarını da kontrol edin:

| Ayar | Ne işe yarar |
| --- | --- |
| Telefon ülkesi | Ülke kodu olmadan yazılmış telefon numaralarını okumak için kullanılır. |
| Varsayılan para birimi | Para birimi olmayan satırlar için kullanılır. |
| Tarih biçimi | Yalnızca `05/06/2026` gibi tarihler iki şekilde okunabildiğinde sorulur. |

Dosyanızda bir ödeme sütunu varsa Akeed **Hangi siparişleri onaylayalım?** diye sorar ve kullandığınız değerleri iki gruba ayırır: **Onayla · kapıda ödeme** ve **Atla · önceden ödenmiş**. Bir değeri taşımak için üzerine dokunun. Akeed sonraki dosyalarınız için seçimlerinizi hatırlar.

### 3. Siparişleri önizleyin

Akeed her satırı kontrol eder ve kaç siparişin hazır olduğunu, diğerlerinin ise neden atlanacağını gösterir. Henüz hiçbir şey içe aktarılmadı. Satırları görmek için bir nedenin yanındaki **Değiştir** veya **Göster** seçeneğini kullanın.

| Sonuç | Anlamı | Ne yapmalı |
| --- | --- | --- |
| Hazır | İçe aktarılacak ve onaylanacak. | Hiçbir şey. |
| Düzeltilmeli | Telefon numarası gibi zorunlu bir bilgi eksik veya geçersiz. | Numarayı ekranda düzeltin ya da dosyayı düzeltip yeniden yükleyin. |
| Yinelenen | Daha önce içe aktarılmış ya da aynı dosyada tekrarlanmış. | Hiçbir şey. Yeniden içe aktarılmaz. |
| Hariç tutuldu | Bilerek atlandı. Aşağıdaki nedenlere bakın. | Olduğu gibi bırakın ya da olası bir yinelemeyse dahil edin. |

Ödeme kapıda ödeme değilse, sipariş tarihi 7 günden eskiyse ya da sipariş zaten sizde olan bir siparişe benziyorsa (son 7 gün içinde aynı telefon ve tutar ya da son 30 gün içinde aynı sipariş numarası) satırlar hariç tutulur. Olası bir yinelemenin aslında gerçek ve yeni bir sipariş olduğunu biliyorsanız **Yine de dahil et** seçeneğini seçin.

### 4. İçe aktarın ve onayı başlatın

Önizleme, maliyet ve zamanlama bilgisiyle biter: mesaj sayısı, hatırlatmalar açıksa bunun en fazla iki katı, gönderimden sonraki bakiyeniz ve tahmini süre. **N müşteriye gönder** düğmesine basın.

Akeed ardından hazır siparişleri içe aktarır ve onayı başlatır. Her siparişin durumunu **Onaylar** bölümünden takip edebilirsiniz.

> [!WARNING]
> Bakiyeniz tüm siparişleri karşılamıyorsa ya da otomatik onay kapalıysa **Gönder** engellenir ve hiçbir şey gönderilmez. Akeed kaç kredinizin eksik olduğunu ve bir **Kredi satın al** düğmesi gösterir. Kısmi başlatma yoktur.

## Akeed’in Tanıdıkları

Sütunlarınızı yeniden adlandırmanız gerekmez. Akeed, Shopify sipariş dışa aktarımlarında kullanılanlar da dahil olmak üzere İngilizce ve Arapça yaygın adları tanır.

| Bilgi | Tanınan ad örnekleri |
| --- | --- |
| Müşteri telefonu | Phone, Mobile, Shipping Phone, Billing Phone, WhatsApp, رقم الهاتف, الموبايل |
| Müşteri adı | Customer name, Full name, Shipping Name, الاسم, اسم العميل. Ad ve soyad sütunları birleştirilir. |
| Tutar | Amount, Total, Price, COD Amount, الإجمالي, المبلغ |
| Sipariş numarası | Order ID, Order Number, Name (`#1001` gibi değerler içerdiğinde), رقم الطلب |
| Para birimi | Currency, العملة |
| Ödeme yöntemi | Payment Method, Payment, Financial Status, طريقة الدفع |
| Sipariş tarihi | Order Date, Created at, التاريخ |
| Şehir ve adres | City, Governorate, Shipping City, Address, Shipping Street, المدينة, العنوان |

E-posta ve ürün (sipariş kalemi) sütunları içe aktarılmaz. Shopify dışa aktarımları her ürün için bir satır içerir. Aynı sipariş numarasına, telefona ve tutara sahip satırlar tek bir siparişte birleştirilir.

### Telefon numaraları

- Bir dosyada birden fazla telefon sütunu varsa Akeed önce **teslimat telefonunu**, ardından **telefonu**, sonra **fatura telefonunu** kullanır. Farklı bir sütun seçebilirsiniz.
- Numaralar uluslararası biçime dönüştürülür. `+` veya `00` ile başlayan bir numara kendi ülkesini korur. Diğer numaralar, varsayılan olarak mağazanızın ülkesi veya Mısır olan **Telefon ülkesi** ayarını kullanır.
- Excel’de baştaki sıfırı kaybolmuş Mısır numaraları onarılır.
- Sabit hat numaraları, iki numara içeren hücreler ve Excel’in bilimsel gösterime çevirdiği numaralar (`2.01E+11` gibi) reddedilir, çünkü WhatsApp geçerli tek bir cep telefonu numarasına ihtiyaç duyar. Telefon sütununu metin olarak biçimlendirin ya da numarayı önizleme ekranında düzeltin.

### Para birimi ve tutarlar

- Para birimi, satırın para birimi sütunundan alınır. Böyle bir sütun yoksa Akeed tutarın içinde yazılı bir kodu veya simgeyi de okur (`EGP 750` veya `750 ج.م` gibi). O da yoksa varsayılan para biriminizi kullanır.
- Desteklenen para birimleri: EGP, SAR, AED, QAR, KWD, BHD, OMR, JOD, MAD, USD ve EUR.
- Tutarlar sıfırdan büyük olmalı ve en fazla iki ondalık basamak içermelidir. Arapça rakamlar anlaşılır. Bir virgül binlik ayırıcı da ondalık ayırıcı da olabiliyorsa Akeed tahmin etmek yerine o satırı düzeltmenizi ister.

## Kaydedilen Sütun Eşleştirmesi

Sütun adımını geçtiğinizde Akeed eşleştirmenizi kaydeder. Bir sonraki sefer aynı sütun adlarına sahip bir dosya yüklediğinizde, sütunların sırası ne olursa olsun, eşleştirme otomatik olarak uygulanır. Yine de gözden geçirip değiştirebilirsiniz. Ödeme değerleri için yaptığınız kapıda ödeme seçimleri de hatırlanır.

## Bekletilen Siparişler ve Güvenlik

İçe aktarmadan sonra ve onay başlamadan önce siparişler **bekletilir** ve Onaylar listesinde **Başlatılmayı bekliyor** olarak gösterilir. Bekletilen bir siparişe mesaj gönderilmemiştir.

**Gönder** içe aktarma ve başlatma işlemini tek adımda yaptığı için bu durumu normalde hiç görmezsiniz. Yalnızca içe aktarmadan sonra başlatma engellenirse, örneğin bakiyeniz değiştiyse görürsünüz. Bu durumda siparişler bekler ve bunları içe aktarma ekranından başlatabilirsiniz.

| Kural | Ayrıntılar |
| --- | --- |
| Başlatma | Başlatma, o içe aktarmadaki bekletilen tüm siparişlere gönderim yapar. Bir siparişi dışarıda bırakmak için göndermeden önce onu dosyadan çıkarın ve dosyayı yeniden yükleyin. |
| Başlatma süresi | Bekletilen siparişler 24 saat içinde başlatılmalıdır. Aksi halde ücretsiz olarak geri çekilir ve dosyayı yeniden yükleyebilirsiniz. |
| Gönderim hızı | WhatsApp kalite puanınızın sağlıklı kalması için Akeed gönderimleri kademeli olarak, dakikada yaklaşık 20 ilk mesaj olacak şekilde yapar. |
| Sessiz saatler | Ayarlar’da sessiz saatler belirlediyseniz gönderim bu saatlerde duraklar ve sonrasında devam eder. |
| Kredi bitmesi | Gönderim sırasında kredi biterse içe aktarma duraklar. Kredi satın alın ve **Devam et** seçeneğini seçin. |

## Aynı Dosya İki Kez: Tasarım Gereği Güvenli

- Sipariş numarası olan bir sipariş, aynı dosyayı yeniden yükleseniz ya da İçe aktar’a iki kez bassanız bile **bir kez** içe aktarılır.
- Aynı dosyayı 24 saat içinde yeniden yüklerseniz Akeed sizi uyarır ve devam etmenize ya da önceki içe aktarmayı görüntülemenize izin verir.
- Sipariş numarası olmayan siparişlere Akeed bir referans verir. Telefonları ve tutarları yakın tarihli bir siparişle eşleşirse olası yineleme olarak işaretlenir ve siz dahil etmedikçe dışarıda bırakılır.

## Onaylar Listesindeki İçe Aktarılan Siparişler

İçe aktarılan siparişler diğer tüm siparişlerle aynı **Onaylar** listesinde yer alır ve aynı şekilde çalışır: durum, hatırlatma, yanıt yok işlemleri, yeniden deneme ve iptal etme, kredi kullanımı. İlk mesajdan önceki durumlar **Başlatılmayı bekliyor**, **Sırada** ve **Gönderiliyor** durumlarıdır.

## Gizlilik ve Saklama

- Dosyanızın kendisi hiçbir zaman saklanmaz. Akeed yalnızca dosyanın adını, boyutunu ve parmak izini tutar.
- Göndermediğiniz bir içe aktarmanın süresi 24 saat sonra dolar ve satırları silinir.
- Gönderilen içe aktarmalardaki satır ayrıntıları 90 gün sonra silinir. Sayılar ve her siparişe giden bağlantı kalır.
- Telefon numaraları ve adlar Akeed’in günlük kayıtlarına yazılmaz.
- Aynı anda birkaç içe aktarma işleminiz devam edebilir ve yüklemeler dakikada birkaç tane ile sınırlıdır.

## Sorun Giderme

| Gördüğünüz | Ne yapmalı |
| --- | --- |
| Bu dosya türü desteklenmiyor | Makro ve parola olmadan Excel Çalışma Kitabı (`.xlsx`) veya CSV UTF-8 olarak kaydedin. |
| Bu dosyada çok fazla sipariş var | Dosyayı en fazla 100 sipariş içeren dosyalara bölün. |
| Bir sütun için yardımınıza ihtiyacımız var | Sütun adımında telefon, ad veya tutar için doğru sütunu seçin. |
| Excel bu telefonu 2.01E+11 gibi bir sayıya çevirdi | Telefon sütununu metin olarak biçimlendirin ve dosyayı yeniden dışa aktarın. |
| Bu bir sabit hat numarası | Müşterinin cep telefonu numarasıyla değiştirin. |
| Kapıda ödeme değil, bu yüzden onaylanmayacak | Ödeme değerini kontrol edin. Gerçekten kapıda ödemeyse sütun adımında **Onayla · kapıda ödeme** grubuna taşıyın. |
| Sipariş 7 günden eski | Bu kadar eski siparişleri onaylamak için çok geç. Tarih kontrollerini atlamak için sütun adımında sipariş tarihini **Dosyada yok** olarak ayarlayın. |
| Başlatmak için kredi satın alın | Bakiyeniz tüm siparişleri karşılayacak kadar kredi satın alın, ardından yeniden **Gönder** düğmesine basın. |
| Otomatik onay kapalı | Ayarlar’dan açın, ardından gönderin. |
| Bu içe aktarmanın süresi doldu | Dosyayı yeniden yükleyin. |
| Bu mağaza için içe aktarma kullanılamıyor | Toplu içe aktarma bağımsız hesaplar içindir. Shopify mağazaları siparişleri otomatik olarak alır. |

## SSS

### İçe aktarma mesaj gönderir mi?

Hayır. Mesajlar yalnızca **Gönder** düğmesine bastıktan sonra gönderilir ve Akeed önce maliyeti gösterir.

### 100’den fazla sipariş içe aktarabilir miyim?

Tek bir dosyada hayır. Dosyayı en fazla 100 sipariş içeren parçalara bölün ve her parçayı ayrı içe aktarın.

### İçe aktarmadan sonra hangi siparişlerin onaylanacağını seçebilir miyim?

Başlatma tüm içe aktarmaya uygulanır. **Gönder** düğmesine basmadan önce istemediğiniz siparişleri dosyadan çıkarın.

### Yanıt vermeyen müşterilere ne olur?

Diğer tüm siparişlerdeki gibi: bir hatırlatma, ardından **Yanıt yok**. [Otomasyon Kuralları](/docs/automation-rules) kılavuzuna bakın.

### Bir içe aktarma ne kadar kredi kullanır?

Mesaj başına bir kredi. 80 hazır sipariş içeren bir dosya 80 kredi kullanır (kredi başına EGP 2,00 ile EGP 160); hatırlatmalar açıksa ve müşteriler yanıt vermezse bu 160 krediye kadar çıkabilir.

### Atlanan satırların raporunu indirebilir miyim?

Henüz değil. Önizleme ekranı atlanan her satırın nedenini gösterir.

## İlgili Kılavuzlar

- [Akeed’i Shopify Olmadan Kullanma](/docs/standalone-platform)
- [Sipariş Onayı](/docs/order-confirmation)
- [Otomasyon Kuralları](/docs/automation-rules)
- [Sorun Giderme](/docs/troubleshooting)
