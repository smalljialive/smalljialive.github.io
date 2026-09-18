---
abbrlink: ''
categories:
- - AI
comments: false
cover: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/75ae4dc4e4c7137e4a5375dcbf28a976.png
date: '2026-09-18T15:21:49.182832+08:00'
tags:
- AI
- Codex
- Chatgpt
title: Codex接入第三方API中转站:CC Switch配置、原理与避坑记录
top_img: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/75ae4dc4e4c7137e4a5375dcbf28a976.png
updated: '2026-09-18T15:21:53.094+08:00'
---
# Codex 接入第三方 API 中转站：CC Switch 配置、原理与避坑记录

最近开始频繁使用 Codex 之后，我越来越明显地感觉到一个问题：

**AI 编程真正消耗的不是提问次数，而是 Token。**

尤其是让 Codex 长时间读取项目、修改代码、运行测试、分析报错时，一次任务可能就会产生大量上下文。

如果使用频率比较高，仅依赖固定订阅额度并不一定适合所有人。

最近看到一个关于 **Codex + CC Switch + API 中转站** 的方案，核心思路很简单：

> 不改变 Codex 本身，而是把 Codex 的模型请求切换到第三方 API，再按照实际 Token 使用量计费。

这样就多了一种使用 Codex 的方式。

---

## 一、这个方案解决什么问题？

正常情况下，我们使用 Codex，通常有两种思路：

1. 使用 ChatGPT / Codex 官方账号登录
2. 使用 API 调用模型

而第三方 API 中转站，本质上是在 Codex 和模型 API 之间增加了一层代理。

大致流程如下：
![df903acd-f097-4b54-83ac-d9224648dc1e](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/75ae4dc4e4c7137e4a5375dcbf28a976.png)

textCodex 仍然负责：

* 读取项目
* 修改文件
* 执行命令
* 分析代码
* 调用工具
* 完成 Agent 任务

变化的只是模型请求所使用的 API 出口。

简单来说：

> Codex 还是 Codex，只是模型请求不一定继续走原来的官方账号或官方 API。

---

## 二、为什么要使用 CC Switch？

理论上，不安装 CC Switch，也可以直接修改 Codex 的配置文件。

Codex 的用户级配置文件通常位于：

```text
~/.codex/config.toml
```text
~/.codex/config.toml

```

Windows 一般对应：

```text
C:\Users\你的用户名\.codex\config.toml
```text
C:\Users\你的用户名\.codex\config.toml

```

Codex 支持配置自定义 Model Provider，可以设置：

* 模型名称
* API Base URL
* API Key
* 请求协议
* 自定义 Header
* 不同模型供应商

所以，只要第三方 API 能兼容 Codex 所需要的协议，就可以作为模型 Provider 使用。

但是手动配置有一个明显的问题：

> 当你拥有多个 API、中转站或者模型时，反复修改 `config.toml` 会非常麻烦。

CC Switch 的作用，就是把这些 Provider 做成更加方便管理的图形化配置。

例如可以分别保存：

```text
OpenAI 官方
GPT 中转站 A
GPT 中转站 B
DeepSeek
Kimi
其他 OpenAI-Compatible API
```text
OpenAI 官方
GPT 中转站 A
GPT 中转站 B
DeepSeek
Kimi
其他 OpenAI-Compatible API

```

以后需要更换 API 时，可以直接切换 Provider，而不需要每次重新手动修改配置。

---

## 三、开始之前需要准备什么？

整个方案主要需要三个东西。

### 1. Codex

首先确保 Codex 本身已经可以正常启动和使用。

---

### 2. CC Switch

CC Switch 主要负责管理：

```text
Provider
API 地址
API Key
模型
请求协议
本地路由
```text
Provider
API 地址
API Key
模型
请求协议
本地路由

```

可以把它理解成一个 Codex API 配置管理工具。

---

### 3. 一个可以使用的 API 服务

API 来源可以是：

```text
OpenAI 官方 API
第三方 GPT API
API 聚合平台
自建 API Gateway
其他兼容 OpenAI API 的服务
```text
OpenAI 官方 API
第三方 GPT API
API 聚合平台
自建 API Gateway
其他兼容 OpenAI API 的服务

```

这里真正需要关注的并不是“中转站”这三个字，而是：

> **它是否兼容 Codex 所需要的 API 协议。**

---

## 四、在 CC Switch 中添加 Codex API

打开 CC Switch 后，进入 Codex 相关配置，然后添加新的 Provider。

通常需要填写几个核心参数。

---

### Provider Name

Provider Name 只是方便自己识别。

例如：

```text
My GPT API
```text
My GPT API

```

或者：

```text
Codex Relay
```text
Codex Relay

```

也可以直接按照中转站名字命名。

---

### Base URL

这里填写 API 服务商提供的接口地址。

例如：

```text
https://api.example.com/v1
```text
https://api.example.com/v1

```

具体地址必须查看自己所使用平台提供的 API 文档。

不要自己猜接口地址。

因为有的平台 Base URL 是：

```text
https://api.example.com
```text
https://api.example.com

```

而有的平台则要求：

```text
https://api.example.com/v1
```text
https://api.example.com/v1

```

两者不一定通用。

---

### API Key

填写 API 服务提供的 Key。

通常类似：

```text
sk-xxxxxxxxxxxxxxxx
```text
sk-xxxxxxxxxxxxxxxx

```

API Key 本质上相当于账户密码。

因此需要特别注意：

> 不要把 API Key 上传到 GitHub，也不要放进公开截图、视频或者博客文章中。

---

### Model

然后填写或者选择 API 服务支持的模型。

例如：

```text
gpt-5.x
```text
gpt-5.x

```

具体模型名称必须以 API 服务商提供的模型列表为准。

不要因为 Codex 中可以选择某个模型，就默认自己的中转 API 一定支持这个模型。

---

## 五、最重要的一项：Responses API

这是整个配置过程中最容易出现问题的地方。

Codex 的自定义 Provider 可以使用：

```toml
wire_api = "responses"
```toml
wire_api = "responses"

```

一个典型的 Codex 自定义 Provider 配置大致如下：

```toml
model = "你的模型名称"
model_provider = "relay"

[model_providers.relay]
name = "My Relay"
base_url = "https://api.example.com/v1"
wire_api = "responses"
env_key = "CODEX_RELAY_API_KEY"
```toml
model = "你的模型名称"
model_provider = "relay"

[model_providers.relay]
name = "My Relay"
base_url = "https://api.example.com/v1"
wire_api = "responses"
env_key = "CODEX_RELAY_API_KEY"

```

然后通过环境变量保存 API Key：

```text
CODEX_RELAY_API_KEY=你的API_KEY
```text
CODEX_RELAY_API_KEY=你的API_KEY

```

相比直接把 API Key 写进配置文件，这种方式更加安全。

---

## 六、Responses API 和 Chat Completions 有什么区别？

很多中转站最开始是为普通聊天软件设计的，所以主要支持：

```text
/v1/chat/completions
```text
/v1/chat/completions

```

但是 Codex 使用的能力更加复杂。

它不仅仅是发送一句话，然后等待模型回答。

Codex 还可能涉及：

* Tool Calling
* Streaming
* Agent 执行
* 长上下文
* Reasoning
* 多轮工具调用
* Responses API

因此：

> 一个可以正常聊天的 API，不代表一定可以正常运行 Codex。

这也是很多人遇到“API 在聊天软件里能用，但 Codex 不能用”的主要原因之一。

---

## 七、为什么有些 API 需要开启 CC Switch 本地路由？

如果中转站本身原生支持：

```text
/v1/responses
```text
/v1/responses

```

那么 Codex 通常可以直接连接。

流程如下：

```text
Codex
   ↓
第三方 Responses API
```text
Codex
   ↓
第三方 Responses API

```

这种情况下，一般不需要额外做协议转换。

---

但有些中转站可能只支持：

```text
/v1/chat/completions
```text
/v1/chat/completions

```

而 Codex 发出的却是 Responses API 请求。

这样就会出现协议不兼容。

此时，可以通过 CC Switch 的本地路由进行转换。

大致流程变成：

```text
Codex
   ↓
Responses API
   ↓
CC Switch 本地路由
   ↓
Chat Completions
   ↓
第三方 API
```text
Codex
   ↓
Responses API
   ↓
CC Switch 本地路由
   ↓
Chat Completions
   ↓
第三方 API

```

也就是说，CC Switch 在中间承担了一部分协议转换工作。

因此：

> 并不是所有中转站都必须开启本地路由。

是否需要开启，主要取决于上游 API 对 Responses API 的支持情况。

---

## 八、配置完成后怎么判断是否成功？

配置完成以后，不要只看“Codex 有没有回复”。

最好从三个方面进行确认。

---

### 第一项：Codex 能正常工作

可以先发送一个简单任务，例如：

```text
分析一下当前项目目录，并告诉我这个项目使用了什么技术栈。
```text
分析一下当前项目目录，并告诉我这个项目使用了什么技术栈。

```

如果 Codex 可以正常读取项目并返回分析结果，说明最基本的连接已经成功。

---

### 第二项：查看 API 后台请求记录

打开中转站或者 API 服务商后台。

通常可以看到：

```text
请求时间
模型
Input Tokens
Output Tokens
费用
状态码
```text
请求时间
模型
Input Tokens
Output Tokens
费用
状态码

```

如果 Codex 发出请求之后，API 后台立即出现了一条新的调用记录，就说明流量已经进入这个 API。

---

### 第三项：查看余额变化

可以再执行一个稍微复杂一点的任务，例如：

```text
读取整个项目，分析目前存在的问题，但暂时不要修改代码。
```text
读取整个项目，分析目前存在的问题，但暂时不要修改代码。

```

然后查看 API 后台余额或者 Token 使用量是否发生变化。

如果已经产生费用或者 Token 消耗，就可以进一步确认整条链路已经跑通：

```text
Codex
   ↓
CC Switch
   ↓
第三方 API
   ↓
模型
```text
Codex
   ↓
CC Switch
   ↓
第三方 API
   ↓
模型

```

---

## 九、为什么这种方式可能更加省钱？

固定订阅和 API 按量付费，本质上属于两种不同的收费方式。

订阅模式更像：

```text
每月固定费用
+
对应套餐额度
```text
每月固定费用
+
对应套餐额度

```

API 则通常按照实际 Token 使用量计费：

```text
Input Tokens
+
Cached Tokens
+
Output Tokens
=
实际费用
```text
Input Tokens
+
Cached Tokens
+
Output Tokens
=
实际费用

```

对于使用频率不是特别高的人来说，API 按量付费可能会更加灵活。

例如平时只是：

```text
偶尔修改网站
偶尔写 Python 工具
偶尔分析代码
偶尔处理 WordPress
```text
偶尔修改网站
偶尔写 Python 工具
偶尔分析代码
偶尔处理 WordPress

```

并不是每天都进行高强度 AI 编程。

这种情况下，可以根据自己的实际使用量计算到底哪种方式更划算。

---

## 十、“节省 93%”应该怎么看？

视频中提到了 Codex 使用成本可以节省非常高的比例。

但是我认为这个数字不能简单理解成：

> 只要使用中转站，就一定能节省 93%。

实际成本取决于很多因素，例如：

```text
使用的中转站
模型价格
充值价格
平台倍率
Input Token 价格
Output Token 价格
Cache 价格
实际项目大小
使用频率
```text
使用的中转站
模型价格
充值价格
平台倍率
Input Token 价格
Output Token 价格
Cache 价格
实际项目大小
使用频率

```

真正应该计算的是：

```text
实际 Token 数量 × API 实际价格
```text
实际 Token 数量 × API 实际价格

```

然后再和原来的 Codex 使用成本进行比较。

所以相比“究竟能省 80% 还是 90%”，更重要的是：

> API 模式提供了另一种 Codex 成本控制方案。

---

## 十一、中转站真正需要关注的不只是价格

刚开始接触 API 中转站时，很容易只关注倍率。

例如：

```text
0.1 倍
0.2 倍
0.5 倍
```text
0.1 倍
0.2 倍
0.5 倍

```

但如果准备长期使用 Codex，我认为至少还需要注意以下几个问题。

---

### 1. 模型是否真实

中转平台显示某个模型名称，不代表后台一定调用的就是完全相同的模型。

因此需要选择可信的平台。

---

### 2. Responses API 是否完整

Codex 和普通聊天软件不同。

它可能依赖：

```text
Tool Calling
Streaming
Reasoning
长上下文
Responses API
```text
Tool Calling
Streaming
Reasoning
长上下文
Responses API

```

所以：

> 可以聊天，并不等于可以稳定运行 Codex。

---

### 3. API 稳定性

Codex 一次任务可能持续几分钟，甚至更长。

如果 API 经常出现：

```text
429
502
503
Connection Reset
Timeout
```text
429
502
503
Connection Reset
Timeout

```

那么即使价格再低，实际开发体验也会很差。

对于 Codex 来说，稳定性往往比单纯价格更加重要。

---

### 4. 隐私问题

使用第三方 API 时，意味着下面这些内容可能需要经过第三方服务器：

```text
Prompt
源代码
项目上下文
文件内容
任务指令
```text
Prompt
源代码
项目上下文
文件内容
任务指令

```

因此如果项目中包含：

```text
商业源码
客户资料
API Key
服务器密码
数据库密码
内部文档
敏感业务数据
```text
商业源码
客户资料
API Key
服务器密码
数据库密码
内部文档
敏感业务数据

```

就需要特别谨慎。

不要仅仅因为 API 便宜，就忽略代码和数据安全问题。

---

## 十二、比较合理的 Codex 使用方式

如果只是为了降低成本，我认为没有必要所有任务都使用最强、最贵的模型。

可以根据任务难度进行区分。

例如：

```text
简单任务
↓
便宜模型
```text
简单任务
↓
便宜模型

```

例如：

* 修改文案
* 修改简单 CSS
* 小范围代码调整
* 查找文件
* 修改简单配置

---

普通开发任务：

```text
普通任务
↓
中档模型
```text
普通任务
↓
中档模型

```

例如：

* 开发普通功能
* 修改 WordPress 插件
* 编写 Python 工具
* 修复常规 Bug

---

复杂任务：

```text
复杂任务
↓
强模型
```text
复杂任务
↓
强模型

```

例如：

* 系统架构设计
* 大型项目分析
* 复杂 Debug
* 多模块重构
* 数据库架构调整
* 长时间 Agent 任务

这样做最大的优势不是单纯“便宜”。

而是：

> **可以根据任务价值选择模型成本。**

---

## 十三、CC Switch 真正的价值

从长期来看，我认为 CC Switch 最方便的地方并不是简单地“接中转站”。

而是可以把多个 Provider 统一管理。

例如：

```text
OpenAI
GPT API A
GPT API B
DeepSeek
Kimi
其他 OpenAI-Compatible API
自建 Gateway
```text
OpenAI
GPT API A
GPT API B
DeepSeek
Kimi
其他 OpenAI-Compatible API
自建 Gateway

```

需要哪个，就切换到哪个。

Codex 本身不用重新安装，也不用每次手动重新填写配置文件。

这对于经常测试不同模型和 API 的人非常方便。

---

## 十四、常见问题排查

### Codex 报 401

如果出现：

```text
401 Unauthorized
```text
401 Unauthorized

```

通常检查：

```text
API Key 是否正确
API Key 是否已经失效
账户是否还有余额
Authorization 是否正确
Provider 是否配置正确
```text
API Key 是否正确
API Key 是否已经失效
账户是否还有余额
Authorization 是否正确
Provider 是否配置正确

```

---

### Codex 报 404

如果出现：

```text
404 Not Found
```text
404 Not Found

```

重点检查 Base URL。

例如不要搞混：

```text
https://api.example.com
```text
https://api.example.com

```

和：

```text
https://api.example.com/v1
```text
https://api.example.com/v1

```

不同 API 服务的要求可能不同。

---

### 报 model not found

如果出现模型不存在，通常说明：

```text
Codex 配置的模型名称
```text
Codex 配置的模型名称

```

和：

```text
API 实际模型 ID
```text
API 实际模型 ID

```

不一致。

可以优先查看 API 服务提供的模型列表。

有些平台支持：

```text
/v1/models
```text
/v1/models

```

可以通过这个接口查看实际可用的模型 ID。

---

### 普通聊天可以用，但是 Codex 用不了

这种情况很可能不是 API Key 的问题，而是协议问题。

重点确认 API 是否支持：

```text
/v1/responses
```text
/v1/responses

```

如果服务只支持：

```text
/v1/chat/completions
```text
/v1/chat/completions

```

那么可能需要通过 CC Switch 本地路由进行协议转换。

---

### 切换 Provider 后还是使用原来的模型

修改 Provider 后，可以完全退出当前 Codex，再重新启动。

因为当前 Codex 进程可能仍然加载着之前的：

```text
config.toml
```text
config.toml

```

重新启动以后再测试会更加保险。

---

## 十五、一个简单的判断流程

如果配置中转站以后 Codex 无法运行，可以按照下面的顺序排查：

```text
Codex 是否正常安装
        ↓
API Key 是否正确
        ↓
账户是否有余额
        ↓
Base URL 是否正确
        ↓
模型名称是否正确
        ↓
是否支持 Responses API
        ↓
是否需要 CC Switch 本地路由
        ↓
检查 API 后台错误日志
```text
Codex 是否正常安装
        ↓
API Key 是否正确
        ↓
账户是否有余额
        ↓
Base URL 是否正确
        ↓
模型名称是否正确
        ↓
是否支持 Responses API
        ↓
是否需要 CC Switch 本地路由
        ↓
检查 API 后台错误日志

```

不要一开始就不停修改 Codex。

很多情况下，真正的问题其实来自：

```text
API 地址
模型名称
协议兼容性
```text
API 地址
模型名称
协议兼容性

```

---

## 十六、总结

整个 Codex 接入第三方 API 的方案其实没有想象中复杂。

核心流程可以概括成：

```text
准备 API
   ↓
添加到 CC Switch
   ↓
配置 Codex Provider
   ↓
确认 Responses API
   ↓
启动 Codex
   ↓
检查 Token 和费用
```text
准备 API
   ↓
添加到 CC Switch
   ↓
配置 Codex Provider
   ↓
确认 Responses API
   ↓
启动 Codex
   ↓
检查 Token 和费用

```

理解以后会发现：

> 所谓 Codex 接入第三方中转站，本质上就是改变模型请求所使用的 API 出口。

Codex 仍然负责真正的 Agent 工作。

CC Switch 则负责：

```text
管理 Provider
切换 API
切换模型
管理配置
必要时进行协议转换
```text
管理 Provider
切换 API
切换模型
管理配置
必要时进行协议转换

```

这种方案最大的价值，也并不只是所谓的“节省 90%”。

更重要的是获得了：

* 模型选择权
* API 选择权
* 成本控制能力
* 多 Provider 管理能力
* 更灵活的 Codex 使用方式

对于经常使用 Codex 做网站开发、Python 工具、WordPress、自动化或者其他编程工作的用户来说，这是一套值得了解的方案。

不过在使用第三方 API 时，也需要始终注意两个问题：

> **稳定性和数据安全。**

价格低只是其中一个因素。

真正适合长期使用的 Codex API，应该同时满足：

```text
价格合理
+
模型可靠
+
Responses API 兼容
+
连接稳定
+
数据安全
```text
价格合理
+
模型可靠
+
Responses API 兼容
+
连接稳定
+
数据安全

```

这样才是真正适合长期使用的方案。

---

## 参考

视频：

**《猛猛蹬！Codex 使用成本节省 93%！5 分钟搞定！｜免 GPT 账号免魔法免月费｜中转站保姆级教程》**

YouTube：

```text
https://www.youtube.com/watch?v=EokA_WwsicE
```text
https://www.youtube.com/watch?v=EokA_WwsicE

```

Codex 官方配置文档：

```text
https://developers.openai.com/
```text
https://developers.openai.com/

```

CC Switch 项目及相关说明可以在 GitHub 中搜索：

```text
CC Switch
Codex CC Switch
```text
CC Switch
Codex CC Switch

```

---

> 本文主要用于记录 Codex 接入第三方 API 的配置思路和常见问题。不同 API 平台的接口地址、模型名称、价格和协议支持情况可能会发生变化，实际配置时应以对应服务商最新文档为准。
