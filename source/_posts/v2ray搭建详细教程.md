---
title: V2Ray搭建详细教程
tags: []
id: '347'
categories:
  - - 问题大全
comments: false
date: 2024-06-15 14:37:53
---

服务器搭建脚本大全：[https://v2cross.com/1746.html](https://v2cross.com/1746.html) 本文转载至Github代码管理平台：[https://github.com/233boy/v2ray/wiki/V2Ray%E6%90%AD%E5%BB%BA%E8%AF%A6%E7%BB%86%E5%9B%BE%E6%96%87%E6%95%99%E7%A8%8B](https://github.com/233boy/v2ray/wiki/V2Ray%E6%90%AD%E5%BB%BA%E8%AF%A6%E7%BB%86%E5%9B%BE%E6%96%87%E6%95%99%E7%A8%8B) 搭建 V2Ray 看这篇文章就够了！这是最详细的 V2Ray 搭建教程，详细的图文教程确保你可以百分百成功搭建 V2Ray 使用。

## 前言

此 V2Ray 教程完完全全是为小白准备的，从购买 VPS 到使用 SSH 登录并使用 V2Ray 一键安装脚本配置 V2Ray

详细的图文教程确保你可以百分百成功搭建 V2Ray 使用，哪怕你是第一次接触这些陌生的东西。 由于 V2Ray 的配置对于小白来说是非常不友好的， 所以此 V2Ray 教程的 V2Ray 服务器端配置将会使用我本人撰写的 [V2Ray一键安装脚本](https://github.com/233boy/v2ray/wiki/V2Ray%E4%B8%80%E9%94%AE%E5%AE%89%E8%A3%85%E8%84%9A%E6%9C%AC) 这是一个对小白友好的 V2Ray 一键脚本，简化 V2Ray 安装和管理，你还可以快速打开 BBR 来优化 V2Ray

## V2Ray

 

官网：[https://www.v2fly.org/](https://www.v2fly.org/) [V2Ray(Project V)](https://www.v2fly.org/) 相对于 Shadowsocks，V2Ray 更像全能选手，拥有更多可选择的协议 / 传输载体 (Socks、HTTP、TLS、TCP、mKCP、WebSocket )，还有强大的路由功能，不仅仅于此，它亦包含 Shadowsocks 组件，你只需要安装 V2Ray，你就可以使用所有的 V2Ray 相关的特性包括使用 Shadowsocks，由于 V2Ray 是使用 GO 语言所撰写的，天生的平台部署优势，下载即可使用，当然啦，由于 V2Ray 的配置相对来说是很繁琐的，毫无夸张的说 但是有了本人所写的 [V2Ray一键安装脚本](https://github.com/233boy/v2ray/wiki/V2Ray%E4%B8%80%E9%94%AE%E5%AE%89%E8%A3%85%E8%84%9A%E6%9C%AC) 加持下，使用 V2Ray 便会显得轻松多了。

## 流程

 

总结一下此文章的大致流程，此 V2Ray 教程可百分百帮助你搭建 V2Ray 使用，哪怕你是第一次接触这些陌生的东西。

*   购买一个 VPS 想要搭建 V2Ray，就必须要拥有一台 VPS。
*   获取 VPS 信息 我们必须要知道 VPS IP 地址，root 用户密码，SSH 端口
*   安装 Xshell Xshell 是一个 SSH 客户端，要登录 VPS，当然需要 SSH 客户端
*   登录 VPS 使用 Xshell 配置 VPS SSH 信息，然后登录
*   安装 V2Ray 极速安装，全程自动
*   V2Ray 安装完成 此时你可以使用客户端配置 V2Ray 使用了
*   V2Ray 高级玩法 配置 VMess-WS-TLS ， VLESS-gRPC-TLS，动态端口等

## 机场推荐

 

如果你只是单纯的翻，墙需求，可以购买机场的，不用自己搭建什么的，省心省力。 机场推荐： [Just My Socks](https://on.affpass.com/go/jms) [Just My Socks](https://on.affpass.com/go/jms) 是搬瓦工提供的 Shadowsocks & V2Ray 服务，不怕跑路，非国人商家，无须担心 IP 被墙问题。 购买教程： [Just My Socks 详细图文购买教程](https://bwgjms.com/post/how-to-buy-justmysocks/)

## 购买一个VPS

 

想要搭建 V2Ray， 拥有一个 VPS 是必需的。 我们推荐使用：[搬瓦工（Bandwagon Host）](https://on.affpass.com/go/bwg) VPS 来搭建 V2Ray 搬瓦工是一个对中国用户极度友好的 VPS 商家，有香港，CN2 GIA 优化线路，并且支持支付宝付款，当然也是支持退款的！ 没有找到合适的套餐？你可以前往官网详细查看：[https://bwh89.net/cart.php](https://on.affpass.com/go/bwg) 哪个套餐好？ 一般来说，**推荐购买 香港线路** 或 **CN2 GIA 线路**，或者哪个便宜选择那个，说着当然如果你使用量比较多或者想要分享给同学和朋友一起用的话，选择合适的套餐即可。又或者你土豪的话，选择最贵的也行。 **VPS 速度：香港线路 > 日本线路 > CN2 GIA 线路 > CN2 线路 > 普通线路** **香港套餐 VPS 的速度最快。** 如果你非常在乎速度的话，建议购买香港线路的 VPS，当然，但价格贵，流量相对其他套餐来说也是比较少的……退一步的选择是 `CN2 GIA` 线路，这个线路的速度也比较好。 线路是比较重要的，像香港和 CN2 GIA 线路到晚上一般不会怎么炸，普通线路的到了晚上可能会出现很慢慢的感觉。 我本人比较推荐 `CN2 GIA` 线路，稳定性，速度与价格适中选择。 当然啦！如果你觉得价格太贵了，推荐你查看一下 [Just My Socks](https://justmysocks.xyz/justmysocks-v2ray/) ，搬瓦工官方出品的代理服务，优质的 CN2 GIA 线路，**每月仅需 $2.88 起！**再也不用自己折腾搭建了，**最最最最重要的是：被墙自动换 IP，无须担心 IP 被墙！** Just My Socks 购买教程在这里： [Just My Socks 购买及使用](https://justmysocks.xyz/justmysocks-v2ray/) 毫无疑问！绝对的一分钱一分货。

> 如果出现 out of stock 这样的提示，那就是这个套餐卖完了，选择其他套餐即可。

## 添加到购物车

在上面表格中选择想要购买的套餐，然后点击 `购买` 即可。 将 VPS 添加到购物车 ![](https://camo.githubusercontent.com/6d53cf4834694794ff79163628568842d449e1954d90089bf5a27c9161e0331e/68747470733a2f2f692e6c6f6c692e6e65742f323031382f31312f31382f356266313638343734323638322e706e67) 说明一下，在Billing Cycle选项那里选择：`$xxxx USD Annually`，按年付的意思 **推荐按年付，比按月付最高可省55%的钱** 如果你选择购买 `CN2 GIA` 的线路 在添加到购物车的时候，`Location` 的选项，可以选择 `JP - Equinix Osaka Softbank (JPOS_1)` 这样来就是使用日本软银线路 然后点击`Add To Cart`

## 结算

 

推荐使用搬瓦工优惠码： [BWHCCNCXVV](https://on.affpass.com/go/bwg) 这个优惠码是搬瓦工目前最高优惠的优惠码 输入优惠码之后点击 `Validate Code >>` ![输入优惠码](https://camo.githubusercontent.com/b8132bffd7a8d6b560031165bdf1684a788db34d8446aa10696c254488507ec4/68747470733a2f2f692e6c6f6c692e6e65742f323031382f31312f31382f356266313638343734343233632e706e67) 然后点击 `Checkout` 如下图所示：已经使用搬瓦工优惠码 ![Checkout](https://camo.githubusercontent.com/3a817863da5c926105c8586c6eeb3158e69e530016557251506bea7c6d4e78e8/68747470733a2f2f692e6c6f6c692e6e65742f323031382f31312f31382f356266313638343730336365632e706e67) 然后会提示你注册账号 （如果你没账号或者还没登录） 请按照下面图片提示来填写~ ![Checkout now](https://camo.githubusercontent.com/6df6a46fde207494e14ce9bd93e3fc3255947ecda2536b4d6668e2e0070bdc1f/68747470733a2f2f692e6c6f6c692e6e65742f323031382f31312f31382f356266313664613638333263362e706e67) 要注意的是，Country 选项记得选择 `China`，Payment Method 选择 `Alipay` 不要忘了勾上 I have read and agree to the Terms of Service 然后 `Complete Order`

## 付款

 

点击 `Pay now` 之后便会跳转到支付宝付款界面，完成付款即可 ![Pay now](https://camo.githubusercontent.com/2b710c103aecabef34f328cb42e8928d8373f61151af315992eb0434d3118cea/68747470733a2f2f692e6c6f6c692e6e65742f323031382f31312f31382f356266313638343733323137352e706e67)

## 获取VPS信息

 

确保你已经成功付款之后 打开：[https://bwh89.net/services](https://bwh89.net/services) 在 Manage 那选择 `Open KiwiVM` 如果出现以下界面，稍等一会，等待资源分配即可。 ![Task in progress](https://camo.githubusercontent.com/14b99238cd6ddb32c819d65305f60465596299765adfc9ae8d4f820b2c03e3d9/68747470733a2f2f692e6c6f6c692e6e65742f323031372f30392f30352f353961653861386663383365322e6a7067) 等待两三分钟，刷新一下。 这是已经在运行的界面，请记下 `IP address`然后点击 `stop` ![停止VPS](https://camo.githubusercontent.com/1b256887a84b753c06004bfb25fbc2e3e91af116441a6d8e1b76ae06c165d62c/68747470733a2f2f692e6c6f6c692e6e65742f323031382f31312f31382f356266313638343733336365632e706e67) 当出现：Great Success! Virtual server will stop in a few seconds. 相关提示 证明 VPS 已经停止了，我们需要重装一个系统。点击左边的 `Install new OS` 之后选择 `ubuntu-22.04-x86_64` 再勾上：`I agree that all existing data on my VPS will be lost.` 然后点击 `Reload` ![Install new OS](https://camo.githubusercontent.com/cf4ba023e7a145bc1019691143faddfe2cbc7194db1e94d26b031a68a6552556/68747470733a2f2f766970322e6c6f6c692e696f2f323032332f30352f31332f4464706f5a424a6752316a76746e462e706e67) 当点击 `Reload` 之后，稍等片刻将会出现下图所示的界面， 请务必记下： `You will need a new root password to access your VPS：xxxx` 还有：`New SSH Port:` 一个是 root密码，一个是 SSH端口 ![Reload](https://camo.githubusercontent.com/ed8194f253056c4c5b3ce4d573c5f0b414a7633b2a479098f58bbcbda927dc45/68747470733a2f2f692e6c6f6c692e6e65742f323031382f31312f31382f356266313638343733623333642e706e67) OK，这时我们已经获取到VPS的信息了。

## 安装 Xshell

 

Xshell 是一个易用的 SSH 客户端，要登录 VPS，当然需要 SSH 客户端 [Xshell 下载链接点我](https://cdn.netsarang.net/v7/Xshell-latest-p) 下载好了就打开安装包来安装； ![安装Xshell](https://camo.githubusercontent.com/e315a282028e57504a60244e53185d33eb49750ceece27c8dedae6020522d130/68747470733a2f2f63646e2e73612e6e65742f323032332f31322f31382f46744f58495748534e47376c62616f2e706e67) 接受协议 ![Xshell接受协议](https://camo.githubusercontent.com/7d44a704d02046bb1655a2cb882885f5c36b1c351cc9e6d7a556c10126d05660/68747470733a2f2f63646e2e73612e6e65742f323032332f31322f31382f6f3141583762333973357450764b662e706e67) 选择安装文件夹 ![Xshell选择安装文件夹](https://camo.githubusercontent.com/80a8ca571eee3b1d827eba0555700968a795254d7094316ec6f7ccae4b8565f0/68747470733a2f2f63646e2e73612e6e65742f323032332f31322f31382f584c515571665346744342374476772e706e67) 选择程序文件夹 ![Xshell选择程序文件夹](https://camo.githubusercontent.com/a981dfef3163bc23088a638295663597382b5fd2b327e5c2377781cca6102d65/68747470733a2f2f63646e2e73612e6e65742f323032332f31322f31382f7133786d6f64774a466349624732482e706e67) 安装状态 ![Xshell安装状态](https://camo.githubusercontent.com/b041898a1c2792e998b29cb05e5a92367f2731fe84e26dec051103b6153e11c5/68747470733a2f2f63646e2e73612e6e65742f323032332f31322f31382f745a786d774b4e6b326963734f4d502e706e67) 安装完成 ![Xshell安装完成](https://camo.githubusercontent.com/a70acbc7fb2ae4d8bbcdc9fab2a3442919d3e689cfc6ae62aacf8191304e2b0c/68747470733a2f2f63646e2e73612e6e65742f323032332f31322f31382f55356d526a6465467437694344416c2e706e67) 输入名称跟邮箱来注册，之后点击提交 ![Xshell注册](https://camo.githubusercontent.com/eb688eca6caab181a3eced060d60c522e956d2fc8bd39b58f25f844cbdab4e52/68747470733a2f2f63646e2e73612e6e65742f323032332f31322f31382f6f705243386a62365647714e3459322e706e67) 注册完成，点击确定 ![Xshell注册完成](https://camo.githubusercontent.com/d73ee85356fc215e30204753f78d6fa2c8c829ce7375e36aca0588e53f46f358/68747470733a2f2f63646e2e73612e6e65742f323032332f31322f31382f70466c344f54594857777263427a662e706e67)

## 登录VPS

 

在 Xshell 新建一个会话。 ![新建会话](https://camo.githubusercontent.com/26bd642e6ca293dd8123272c4306e2a3e9e7bee21bb0afeb97649fe56b1c6463/68747470733a2f2f692e6c6f6c692e6e65742f323031382f31322f32372f356332346630633864373866362e6a7067) 主机写上你的 VPS IP 地址，端口写上 SSH 端口。 ![new](https://camo.githubusercontent.com/f66106c919f7004b40b6fa8dfa01c1352739b6c84e46e4e0d5b2200cf20e6377/68747470733a2f2f692e6c6f6c692e6e65742f323031382f31312f31382f356266313638343733353737362e706e67) 之后点击 用户身份验证，用户名：`root`，密码：你的 root 密码。然后点击确定 ![user-and-passwd](https://camo.githubusercontent.com/5461f96782271ed0116bc64daf73e54a10e0761a5bf843c8ad7c55a55cd422b4/68747470733a2f2f692e6c6f6c692e6e65742f323031382f31312f31382f356266313638343733376633632e706e67) 之后选择连接。 ![连接](https://camo.githubusercontent.com/256a0d939d2c84c03a50c8b9fdf5cad3a84fb1a19a0eadbcc40951cd0f12aa73/68747470733a2f2f692e6c6f6c692e6e65742f323031382f31312f31382f356266313638343733396161622e706e67) 然后会提示SSH安全警告，选择，接受并保存。 ![SSH 安全警告](https://camo.githubusercontent.com/94b0b7704a1f41eac1a833f08b93a75e58f3ab1432c81282e746cd66feb88a80/68747470733a2f2f692e6c6f6c692e6e65742f323031382f31312f31382f356266313566346230346337322e706e67) 这是登录成功后的界面 ![登陆成功](https://camo.githubusercontent.com/644313713892e4d11b744f77710f2caccb1d601f45daa2da1865bab79d7ef81a/68747470733a2f2f692e6c6f6c692e6e65742f323031382f31312f31382f356266313566346230636433332e706e67)

## 安装 V2Ray

 

输入下面命令回车，你可以复制过去，然后在 Xshell 界面按 Shift + Insert 即可粘贴，不能按 Ctrl + V 的。。

```bash
bash <(wget -qO- -o- https://git.io/v2ray.sh)
```

## 安装完成

 

当你执行了上面的安装命令，并且没有错误提示的话，那么你就能看到类似下面的图片 ![V2Ray 脚本安装完成](https://camo.githubusercontent.com/f0b343c8aa7fe2642f21090b2bc9fc6bc34e6e997cff0790565af344b0c6633f/68747470733a2f2f766970322e6c6f6c692e696f2f323032332f30352f31312f5745387155735a44677678545661642e706e67) 脚本特意弄了一个时间显示，给反馈用来检测安装时间的… 理论上，绝大多数情况下 15秒内会安装完成 为方便你快速使用，脚本在安装完成后会自动创建一个 VMess-TCP 配置。 此时你可以复制 URL 到相关软件 (例如 v2rayN) 去测试一下是否正常使用。 如果无法正常使用，请尝试使用 `v2ray add ss` 添加一个 SS 来再测试一下

## V2Ray 管理面板

 

现在可以尝试一下输入 `v2ray` 回车，即可管理 V2Ray ![V2Ray 脚本管理面板](https://camo.githubusercontent.com/3f026886ba28d45465d09ca30e1b97ee843f5d9ecb338b109665cef733dcdc40/68747470733a2f2f766970322e6c6f6c692e696f2f323032332f30352f31312f69724b434a424f524555327864795a2e706e67) 提示，如果你不想执行任何功能，直接按 Enter 回车退出即可。

## 无法使用

 

无法使用一般都是两种情况，一是无法连接上端口，二是客户端内核支持有问题。 如果你的 VPS 有外部防火墙，请确保你已经开放了端口 测试端口是否能连接上： 打开：[https://tcp.ping.pe/](https://tcp.ping.pe/) 写上你的 VPS IP 跟端口；内容为 ip:端口，示例：`1.1.1.1:443`，然后点击 `Go`；或者直接回车 如果显示 successful；证明端口能连接；如果显示 failed；那是无法连接上端口。 提醒，你可以使用 `v2ray ip` 查看 VPS IP。 关闭防火墙，执行如下命令： `systemctl stop firewalld; systemctl disable firewalld; ufw disable` 关闭防火墙之后再测试一下端口是否通，如果不通，你可能还有外部防火墙没关，**必须要能连接上端口才能正常使用**。 如果能连接上端口，那就继续 使用 `v2ray add ss` 添加一个 SS 看看能不能正常使用，如果正常使用，证明运行没有问题。 提醒，默认安装的 V2Ray 内核为最新版本 如果无法使用，可能是你客户端的内核太旧 请尝试使用不同的客户端进行测试；比如 v2rayN；v2rayNG 等 请尝试设置 VMessAEAD，某些客户端会有相关选项 某些客户端得把 额外id(alterid) 填写为 0；比如垃圾苹果那边的东西 解决方案一，请尝试将服务器端的内核版本降级 使用 `v2ray update core 4.45.2` 降级即可 解决方案二，升级客户端内核

> 备注，请尽量将客户端内核和服务器端内核保持一致！**内核版本低于 5 可能会出现莫名其妙的问题**

## 快速入门

 

本人的 V2Ray 脚本简化了很多流程，例如我们常用的是 (添加、更改、查看、删除) 配置，以下内容让你可以快速掌握使用 添加配置：

*   `v2ray add` -> 添加配置
*   `v2ray add ss` -> 添加一个 Shadowsocks 配置
*   `v2ray add tcp` -> 添加一个 VMess-TCP 配置
*   `v2ray add kcpd` -> 添加一个 VMess-mKCP-dynamic-port 动态端口配置

备注，使用 `v2ray add` 添加配置的时候，仅 \*TLS 相关协议配置必须提供域名，其他均可自动化处理。 如需查看更多 add 参数用法，请查看 V2Ray 脚本说明 – 更改配置：

*   `v2ray change` -> 更改配置
*   `v2ray change tcp` -> 更改 TCP 相关配置
*   `v2ray change tcp port auto` -> 更改 TCP 相关配置的端口，端口使用自动创建，也可以使用 `v2ray port tcp auto`
*   `v2ray change kcp id auto` -> 更改 mKCP 相关配置的 UUID，UUID 使用自动创建，也可以使用 `v2ray id tcp auto`

如需查看更多 change 参数用法，请查看 V2Ray 脚本说明 – 查看配置：

*   `v2ray info` -> 查看配置
*   `v2ray info tcp` -> 查看 TCP 相关配置
*   `v2ray info kcp` -> 查看 kcp 相关配置

– 删除配置：

*   `v2ray del` -> 删除配置
*   `v2ray del kcp` -> 删除 KCP 相关配置
*   `v2ray del tcp` -> 删除 TCP 相关配置

**提醒，谨慎使用 del 参数** – 非常棒！你已经掌握最常用的功能 (添加、更改、查看、删除) add / change / info / del ： 添加、更改、查看、删除 对于绝大多数用户来说 使用 `v2ray add` 添加配置，使用 `v2ray change` `v2ray info` `v2ray del` 来 (更改、查看、删除) 配置即可。

> 提醒，如果只匹配到一个配置时则自动选择该配置，否则将显示匹配到的配置列表，要求选择其中一个配置

## 打开 BBR 优化

 

使用：`v2ray bbr` 便会自动打开 BBR 优化了！非常简单方便

## mKCP

 

mKCP 这个东西其实就是 KCP 协议，反正你知道是能提速的就行，但是不保证都能提速，还能避免 TCP 阻断 使用方法：服务器输入 `v2ray add kcp` 回车，即可 备注：由于 UDP 的原因也许会被运营商 Qos，这是无解的。 还有就是使用 mKCP 会花费更多流量，请注意！

## 动态端口

 

听说使用动态端口可能会对 ISP 封锁端口有点帮助作用。。 使用方法：服务器输入 `v2ray add kcpd` 回车，即可 也可以使用 `v2ray add tcpd`

## VMess-WS-TLS

 

实现 VMess-WS-TLS 超级无敌简单，前提是要拥有一个能正常解析的域名 (并且知道怎么解析域名) 服务器输入 `v2ray add ws` 回车，输入域名，搞定。

## VLESS-H2-TLS

 

实现 VLESS-H2-TLS 超级无敌简单，前提是要拥有一个能正常解析的域名 (并且知道怎么解析域名) 服务器输入 `v2ray add vh2` 回车，输入域名，搞定。 备注，VLESS-H2-TLS 相比 VMess-WS-TLS，在浏览网页时有一些优势，速度是差不多的啦

## Trojan-gRPC-TLS

 

实现 Trojan-gRPC-TLS 超级无敌简单，前提是要拥有一个能正常解析的域名 (并且知道怎么解析域名) 服务器输入 `v2ray add tgrpc` 回车，输入域名，搞定。 和其他 \*TLS 配置的速度差异？有人说快，有人说慢，你自己对比吧

## 哪个传输协议好？

 

心中无杂念，用 TCP ISP 常作怪，用 动态端口 VPS速度不好，用 mKCP 处子之身，用 \*TLS

## V2Ray 脚本说明

 

请看：[V2Ray一键安装脚本](https://github.com/233boy/v2ray/wiki/V2Ray%E4%B8%80%E9%94%AE%E5%AE%89%E8%A3%85%E8%84%9A%E6%9C%AC) 哎呀，虽然脚本很好用，但是为了你能更加了解掌握各种使用技巧，还是建议看一虾吧！

## V2Ray 脚本帮助

 

使用：`v2ray help`

## 反馈问题

 

Telegram 群组：[https://t.me/tg233boy](https://t.me/tg233boy) Github 反馈：[https://github.com/233boy/v2ray/issues](https://github.com/233boy/v2ray/issues)

## 分享

 

如果这篇文章对你帮助的话，记得分享给你的小伙伴们哦！

## 机场备用

 

为防止自建节点不可用，可考虑购买一个机场作为备用方案，以防止失联 机场推荐： [Just My Socks](https://justmysocks.xyz/justmysocks-v2ray/) [Just My Socks](https://justmysocks.xyz/justmysocks-v2ray/) 是搬瓦工提供的服务，不怕跑路，非国人商家，无须担心 IP 被墙问题。 购买教程：[Just My Socks 购买及使用](https://justmysocks.xyz/justmysocks-v2ray/)

## 其他

 

请勿违反国家法律法规，否则后果自负！ 低调低调低调。

## 结束

 

我有写少了什么吗？我这种小小白萌新看了这教程都觉得很明白了啊。 一次不会，那么就两次，还是不会，那就再来一次。可还是不会啊？大佬请收下我的膝盖。

[返回主页](https://github.com/233boy/v2ray/wiki)