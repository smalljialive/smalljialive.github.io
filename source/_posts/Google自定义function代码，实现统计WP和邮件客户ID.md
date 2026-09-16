---
abbrlink: ''
categories: []
date: '2026-09-16T10:50:05.079856+08:00'
tags: []
title: Google Ads 离线转化回传实操：WordPress + GCLID + WhatsApp + Email
updated: '2026-09-16T10:50:12.289+08:00'
---
# Google Ads 离线转化回传实操：WordPress + GCLID + WhatsApp + Email

做 Google Ads 推广时，很多 B2B 客户并不会直接提交网站表单，而是通过 **WhatsApp、Email** 与销售人员联系。

这种情况下，如果只统计“WhatsApp 点击”或“Email 点击”，Google Ads 并不知道哪些点击最终变成了真正有效的询盘。

更合适的做法是：

**保存 GCLID → 生成 Lead ID → 关联 WhatsApp / Email → 确认有效询盘 → 回传 Google Ads。**

## 一、什么是 GCLID

GCLID 是 Google Ads 为广告点击生成的唯一标识。

当 Google Ads 开启“自动标记”后，客户点击广告进入网站，网址可能类似：

```text
https://www.example.com/product/?gclid=EAIaIQobChMI...
```

其中：

```text
gclid=EAIaIQobChMI...
```

就是这次广告点击的 GCLID。

需要注意：

**GCLID 通常不能在客户联系之后，再通过手机号从 Google Ads 后台反查。**

因此，必须在客户进入网站时提前保存。

## 二、WordPress 网站需要做什么

WordPress 网站可以通过自定义代码完成以下功能：

1. 捕获并保存：
   - `gclid`
   - `gbraid`
   - `wbraid`
   - UTM 参数
2. 为每次新的 Google Ads 点击生成一个 Lead ID，例如：

```text
HY-260916-K7P4WQ
```

3. 保存：

```text
Lead ID
GCLID
首次落地页
首次产品
访问时间
```

4. 在 WordPress 后台增加：

**工具 → Google Ads Leads**

以后可以通过 Lead ID 查询对应的 GCLID。

以下是自定义代码：

```
/**
 * Hengyuan Google Ads Lead Attribution v2.1
 *
 * 功能：
 * 1. 捕获 gclid / gbraid / wbraid / UTM
 * 2. 每次新的 Google Ads 点击生成新的 HY Lead Ref
 * 3. 保存首次落地页、首次产品
 * 4. 根据当前产品页面自动修改 WhatsApp / Email
 * 5. 记录最终联系页面、联系产品、联系方式
 * 6. 支持 Contact Form 7 隐藏字段自动填充
 * 7. WordPress 后台：工具 > Google Ads Leads 查询
 */

if (!defined('ABSPATH')) {
    exit;
}


/* =========================================================
 * 1. 创建数据库表
 * ======================================================= */

function hy_ads_maybe_install() {

    $version = '2.1';

    if (get_option('hy_ads_attribution_db_version') === $version) {
        return;
    }

    global $wpdb;

    $table = $wpdb->prefix . 'hy_ads_attribution';
    $charset_collate = $wpdb->get_charset_collate();

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';

    $sql = "CREATE TABLE {$table} (

        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

        lead_ref VARCHAR(50) NOT NULL,

        gclid VARCHAR(255) NOT NULL DEFAULT '',
        gbraid VARCHAR(255) NOT NULL DEFAULT '',
        wbraid VARCHAR(255) NOT NULL DEFAULT '',

        utm_source VARCHAR(255) NOT NULL DEFAULT '',
        utm_medium VARCHAR(255) NOT NULL DEFAULT '',
        utm_campaign VARCHAR(255) NOT NULL DEFAULT '',
        utm_term VARCHAR(255) NOT NULL DEFAULT '',
        utm_content VARCHAR(255) NOT NULL DEFAULT '',

        first_landing_url TEXT NULL,
        first_product VARCHAR(150) NOT NULL DEFAULT '',

        last_page_url TEXT NULL,

        contact_page_url TEXT NULL,
        contact_product VARCHAR(150) NOT NULL DEFAULT '',
        contact_type VARCHAR(30) NOT NULL DEFAULT '',
        contact_count INT UNSIGNED NOT NULL DEFAULT 0,

        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        contacted_at DATETIME NULL,

        PRIMARY KEY (id),

        UNIQUE KEY lead_ref (lead_ref),

        KEY gclid (gclid(191)),
        KEY created_at (created_at)

    ) {$charset_collate};";

    dbDelta($sql);

    update_option(
        'hy_ads_attribution_db_version',
        $version,
        false
    );
}

add_action(
    'init',
    'hy_ads_maybe_install',
    1
);


/* =========================================================
 * 2. 工具函数
 * ======================================================= */

function hy_ads_clean_url($url) {

    $url = esc_url_raw(
        wp_unslash($url)
    );

    if (!$url) {
        return '';
    }

    $site_host = wp_parse_url(
        home_url('/'),
        PHP_URL_HOST
    );

    $url_host = wp_parse_url(
        $url,
        PHP_URL_HOST
    );

    if (
        !$site_host ||
        !$url_host ||
        strtolower($site_host) !== strtolower($url_host)
    ) {
        return '';
    }

    $scheme = wp_parse_url(
        $url,
        PHP_URL_SCHEME
    ) ?: 'https';

    $path = wp_parse_url(
        $url,
        PHP_URL_PATH
    ) ?: '/';

    return $scheme . '://' . $site_host . $path;
}


function hy_ads_request_text(
    $key,
    $max = 255
) {

    if (!isset($_POST[$key])) {
        return '';
    }

    $value = sanitize_text_field(
        wp_unslash(
            $_POST[$key]
        )
    );

    if (function_exists('mb_substr')) {

        return mb_substr(
            $value,
            0,
            $max
        );
    }

    return substr(
        $value,
        0,
        $max
    );
}


function hy_ads_valid_lead_ref(
    $lead_ref
) {

    return (bool) preg_match(
        '/^HY-[0-9]{6}-[A-Z0-9]{6}$/',
        $lead_ref
    );
}


/* =========================================================
 * 3. 保存 Google Ads 归因
 * ======================================================= */

add_action(
    'wp_ajax_hy_save_ads_attribution',
    'hy_save_ads_attribution'
);

add_action(
    'wp_ajax_nopriv_hy_save_ads_attribution',
    'hy_save_ads_attribution'
);


function hy_save_ads_attribution() {

    global $wpdb;

    $table =
        $wpdb->prefix .
        'hy_ads_attribution';

    $lead_ref =
        hy_ads_request_text(
            'lead_ref',
            50
        );

    if (
        !hy_ads_valid_lead_ref(
            $lead_ref
        )
    ) {

        wp_send_json_error(
            [
                'message' =>
                    'Invalid lead reference'
            ],
            400
        );
    }


    $gclid =
        hy_ads_request_text(
            'gclid',
            255
        );

    $gbraid =
        hy_ads_request_text(
            'gbraid',
            255
        );

    $wbraid =
        hy_ads_request_text(
            'wbraid',
            255
        );


    /*
     * 至少必须有一种 Google Ads 点击 ID
     */

    if (
        $gclid === '' &&
        $gbraid === '' &&
        $wbraid === ''
    ) {

        wp_send_json_error(
            [
                'message' =>
                    'No Google Ads click identifier'
            ],
            400
        );
    }


    $now =
        current_time(
            'mysql'
        );


    $existing =
        $wpdb->get_row(

            $wpdb->prepare(

                "SELECT *
                 FROM {$table}
                 WHERE lead_ref = %s
                 LIMIT 1",

                $lead_ref
            )
        );


    $common = [

        'gclid' => $gclid,

        'gbraid' => $gbraid,

        'wbraid' => $wbraid,

        'utm_source' =>
            hy_ads_request_text(
                'utm_source',
                255
            ),

        'utm_medium' =>
            hy_ads_request_text(
                'utm_medium',
                255
            ),

        'utm_campaign' =>
            hy_ads_request_text(
                'utm_campaign',
                255
            ),

        'utm_term' =>
            hy_ads_request_text(
                'utm_term',
                255
            ),

        'utm_content' =>
            hy_ads_request_text(
                'utm_content',
                255
            ),

        'last_page_url' =>
            hy_ads_clean_url(
                $_POST['page_url'] ?? ''
            ),

        'updated_at' =>
            $now,
    ];


    if ($existing) {

        $wpdb->update(

            $table,

            $common,

            [
                'id' =>
                    (int) $existing->id
            ]
        );

    } else {

        $common['lead_ref'] =
            $lead_ref;

        $common['first_landing_url'] =
            hy_ads_clean_url(
                $_POST['landing_url'] ?? ''
            );

        $common['first_product'] =
            hy_ads_request_text(
                'first_product',
                150
            );

        $common['created_at'] =
            $now;


        $wpdb->insert(
            $table,
            $common
        );
    }


    wp_send_json_success(
        [
            'lead_ref' =>
                $lead_ref
        ]
    );
}


/* =========================================================
 * 4. 记录 WhatsApp / Email / Form 联系
 * ======================================================= */

add_action(
    'wp_ajax_hy_record_ads_contact',
    'hy_record_ads_contact'
);

add_action(
    'wp_ajax_nopriv_hy_record_ads_contact',
    'hy_record_ads_contact'
);


function hy_record_ads_contact() {

    global $wpdb;

    $table =
        $wpdb->prefix .
        'hy_ads_attribution';


    $lead_ref =
        hy_ads_request_text(
            'lead_ref',
            50
        );


    if (
        !hy_ads_valid_lead_ref(
            $lead_ref
        )
    ) {

        wp_send_json_error(
            [
                'message' =>
                    'Invalid lead reference'
            ],
            400
        );
    }


    $existing_id =
        $wpdb->get_var(

            $wpdb->prepare(

                "SELECT id
                 FROM {$table}
                 WHERE lead_ref = %s
                 LIMIT 1",

                $lead_ref
            )
        );


    if (!$existing_id) {

        wp_send_json_error(
            [
                'message' =>
                    'Lead reference not found'
            ],
            404
        );
    }


    $type =
        hy_ads_request_text(
            'contact_type',
            30
        );


    if (
        !in_array(
            $type,
            [
                'whatsapp',
                'email',
                'form'
            ],
            true
        )
    ) {

        $type = '';
    }


    $now =
        current_time(
            'mysql'
        );


    $wpdb->query(

        $wpdb->prepare(

            "UPDATE {$table}

             SET

             contact_page_url = %s,

             contact_product = %s,

             contact_type = %s,

             contact_count =
                contact_count + 1,

             contacted_at = %s,

             updated_at = %s

             WHERE id = %d",

            hy_ads_clean_url(
                $_POST['contact_page_url'] ?? ''
            ),

            hy_ads_request_text(
                'contact_product',
                150
            ),

            $type,

            $now,

            $now,

            (int) $existing_id
        )
    );


    wp_send_json_success(
        [
            'lead_ref' =>
                $lead_ref
        ]
    );
}


/* =========================================================
 * 5. 前端 Google Ads 归因脚本
 * ======================================================= */

add_action(
    'wp_head',
    function () {

        if (is_admin()) {
            return;
        }

        $ajax_url =
            admin_url(
                'admin-ajax.php'
            );
?>

<script id="hyAdsAttribution">

(function () {

    'use strict';


    const AJAX_URL =
        <?php
        echo wp_json_encode(
            $ajax_url
        );
        ?>;


    /*
     * Google Ads 点击数据保留 90 天
     */

    const COOKIE_DAYS = 90;

    const COOKIE_PREFIX = 'hy_';


    const PARAM_KEYS = [

        'gclid',

        'gbraid',

        'wbraid',

        'utm_source',

        'utm_medium',

        'utm_campaign',

        'utm_term',

        'utm_content'

    ];


/* =========================================================
 * Cookie
 * ======================================================= */

    function setCookie(
        name,
        value,
        days
    ) {

        if (!value) {
            return;
        }


        const maxAge =
            Math.floor(
                days * 86400
            );


        document.cookie =

            encodeURIComponent(name)

            + '='

            + encodeURIComponent(value)

            + '; Max-Age='

            + maxAge

            + '; Path=/; SameSite=Lax'

            + (
                location.protocol === 'https:'
                ? '; Secure'
                : ''
            );
    }


    function clearCookie(
        name
    ) {

        document.cookie =

            encodeURIComponent(name)

            + '=; Max-Age=0; Path=/; SameSite=Lax'

            + (
                location.protocol === 'https:'
                ? '; Secure'
                : ''
            );
    }


    function getCookie(
        name
    ) {

        const target =
            encodeURIComponent(name)
            + '=';


        const list =
            document.cookie
            ?
            document.cookie.split(';')
            :
            [];


        for (
            let item of list
        ) {

            item =
                item.trim();


            if (
                item.indexOf(
                    target
                ) === 0
            ) {

                return decodeURIComponent(

                    item.substring(
                        target.length
                    )
                );
            }
        }


        return '';
    }


/* =========================================================
 * Lead Ref
 * ======================================================= */

    function randomString(
        length
    ) {

        const chars =
            'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';


        let out = '';


        if (
            window.crypto &&
            window.crypto.getRandomValues
        ) {

            const buf =
                new Uint32Array(
                    length
                );


            window.crypto
                .getRandomValues(
                    buf
                );


            for (
                let i = 0;
                i < length;
                i++
            ) {

                out += chars[
                    buf[i]
                    %
                    chars.length
                ];
            }


            return out;
        }


        for (
            let i = 0;
            i < length;
            i++
        ) {

            out += chars[

                Math.floor(
                    Math.random()
                    *
                    chars.length
                )
            ];
        }


        return out;
    }


    function createLeadRef() {

        const d =
            new Date();


        const yy =
            String(
                d.getFullYear()
            ).slice(-2);


        const mm =
            String(
                d.getMonth() + 1
            ).padStart(
                2,
                '0'
            );


        const dd =
            String(
                d.getDate()
            ).padStart(
                2,
                '0'
            );


        return (

            'HY-'

            + yy

            + mm

            + dd

            + '-'

            + randomString(6)
        );
    }


/* =========================================================
 * 页面 URL
 * ======================================================= */

    function cleanPageUrl() {

        return (

            location.origin

            +

            location.pathname
        );
    }


/* =========================================================
 * 产品页面识别
 *
 * 这里决定 WhatsApp 和 Email 显示什么产品
 * ======================================================= */

    function getProductContext() {


        const source = (

            location.pathname

            + ' '

            + document.title

        ).toLowerCase();


        /*
         * 1. 移动式混凝土配料站
         */

        if (

            source.includes(
                'mobile-concrete-batching-plant'
            )

            ||

            source.includes(
                'mobile-batching-plant'
            )

            ||

            source.includes(
                'mobile concrete batching plant'
            )

        ) {

            return {

                product:
                    'Mobile Concrete Batching Plant',

                whatsapp:
                    'Hello, I need a mobile concrete batching plant.',

                emailSubject:
                    'Mobile Concrete Batching Plant Inquiry'
            };
        }


        /*
         * 2. 混凝土搅拌泵
         */

        if (

            source.includes(
                'concrete-mixer-pump'
            )

            ||

            source.includes(
                'concrete-mixing-pump'
            )

            ||

            source.includes(
                'mixer-pump'
            )

            ||

            source.includes(
                'concrete mixer pump'
            )

            ||

            source.includes(
                'concrete mixing pump'
            )

        ) {

            return {

                product:
                    'Concrete Mixer Pump',

                whatsapp:
                    'Hello, I need a concrete mixer pump.',

                emailSubject:
                    'Concrete Mixer Pump Inquiry'
            };
        }


        /*
         * 3. 混凝土拖泵
         */

        if (

            source.includes(
                'concrete-trailer-pump'
            )

            ||

            source.includes(
                'trailer-pump'
            )

            ||

            source.includes(
                'diesel-concrete-pump'
            )

            ||

            source.includes(
                'electric-concrete-pump'
            )

            ||

            source.includes(
                'concrete trailer pump'
            )

            ||

            source.includes(
                'diesel concrete pump'
            )

            ||

            source.includes(
                'electric concrete pump'
            )

        ) {

            return {

                product:
                    'Concrete Trailer Pump',

                whatsapp:
                    'Hello, I need a concrete trailer pump.',

                emailSubject:
                    'Concrete Trailer Pump Inquiry'
            };
        }


        /*
         * 4. 水泥仓
         */

        if (

            source.includes(
                'cement-silo'
            )

            ||

            source.includes(
                'cement silo'
            )

        ) {

            return {

                product:
                    'Cement Silo',

                whatsapp:
                    'Hello, I need a cement silo.',

                emailSubject:
                    'Cement Silo Inquiry'
            };
        }


        /*
         * 5. 固定式混凝土配料站
         *
         * 必须放在移动式判断之后
         */

        if (

            source.includes(
                'stationary-concrete-batching-plant'
            )

            ||

            source.includes(
                'concrete-batching-plant'
            )

            ||

            source.includes(
                'concrete batching plant'
            )

            ||

            source.includes(
                'batching plant'
            )

        ) {

            return {

                product:
                    'Stationary Concrete Batching Plant',

                whatsapp:
                    'Hello, I need a stationary concrete batching plant.',

                emailSubject:
                    'Stationary Concrete Batching Plant Inquiry'
            };
        }


        /*
         * 首页 / Contact / Case / Blog 等页面
         */

        return {

            product:
                'Concrete Machinery',

            whatsapp:
                'Hello, I am interested in your concrete machinery.',

            emailSubject:
                'Concrete Machinery Inquiry'
        };
    }


/* =========================================================
 * 获取 URL 中 Google Ads 点击参数
 * ======================================================= */

    const params =
        new URLSearchParams(
            location.search
        );


    const currentClickId =

        params.get('gclid')

        ||

        params.get('gbraid')

        ||

        params.get('wbraid')

        ||

        '';


    const storedClickId =
        getCookie(
            COOKIE_PREFIX
            +
            'click_id'
        );


/* =========================================================
 * 如果是新的 Google Ads 点击
 *
 * 新广告点击 = 新 Lead Ref
 * ======================================================= */

    if (

        currentClickId

        &&

        currentClickId
        !==
        storedClickId

    ) {


        /*
         * 清除上一次 Ads 点击归因
         */

        PARAM_KEYS.forEach(
            function (key) {

                clearCookie(
                    COOKIE_PREFIX
                    +
                    key
                );
            }
        );


        clearCookie(
            COOKIE_PREFIX
            +
            'lead_ref'
        );


        clearCookie(
            COOKIE_PREFIX
            +
            'landing_url'
        );


        clearCookie(
            COOKIE_PREFIX
            +
            'first_product'
        );


        /*
         * 保存本次 GCLID / UTM
         */

        PARAM_KEYS.forEach(

            function (key) {

                const value =
                    params.get(
                        key
                    );


                if (value) {

                    setCookie(

                        COOKIE_PREFIX
                        +
                        key,

                        value,

                        COOKIE_DAYS
                    );
                }
            }
        );


        setCookie(

            COOKIE_PREFIX
            +
            'click_id',

            currentClickId,

            COOKIE_DAYS
        );


        /*
         * 生成新的 HY Lead Ref
         */

        setCookie(

            COOKIE_PREFIX
            +
            'lead_ref',

            createLeadRef(),

            COOKIE_DAYS
        );


        /*
         * 保存首次落地页面
         */

        setCookie(

            COOKIE_PREFIX
            +
            'landing_url',

            cleanPageUrl(),

            COOKIE_DAYS
        );


        /*
         * 保存首次产品
         */

        setCookie(

            COOKIE_PREFIX
            +
            'first_product',

            getProductContext()
                .product,

            COOKIE_DAYS
        );

    } else {


        /*
         * 后续页面如果出现新的 UTM，
         * 只填空值，不覆盖原来的
         */

        PARAM_KEYS.forEach(

            function (key) {


                const value =
                    params.get(
                        key
                    );


                if (

                    value

                    &&

                    !getCookie(
                        COOKIE_PREFIX
                        +
                        key
                    )

                ) {

                    setCookie(

                        COOKIE_PREFIX
                        +
                        key,

                        value,

                        COOKIE_DAYS
                    );
                }
            }
        );
    }


/* =========================================================
 * 当前 Lead Ref
 * ======================================================= */

    const leadRef =
        getCookie(
            COOKIE_PREFIX
            +
            'lead_ref'
        );


    const hasGoogleId = !!(

        getCookie(
            COOKIE_PREFIX
            +
            'gclid'
        )

        ||

        getCookie(
            COOKIE_PREFIX
            +
            'gbraid'
        )

        ||

        getCookie(
            COOKIE_PREFIX
            +
            'wbraid'
        )
    );


    /*
     * 如果不是 Google Ads 流量，
     * 就不继续执行
     */

    if (
        !leadRef
        ||
        !hasGoogleId
    ) {

        return;
    }


/* =========================================================
 * 保存归因数据
 * ======================================================= */

    function buildBaseData() {


        const data =
            new URLSearchParams();


        data.set(
            'lead_ref',
            leadRef
        );


        PARAM_KEYS.forEach(

            function (key) {

                data.set(

                    key,

                    getCookie(
                        COOKIE_PREFIX
                        +
                        key
                    )
                );
            }
        );


        data.set(

            'landing_url',

            getCookie(
                COOKIE_PREFIX
                +
                'landing_url'
            )
        );


        data.set(

            'first_product',

            getCookie(
                COOKIE_PREFIX
                +
                'first_product'
            )
        );


        data.set(

            'page_url',

            cleanPageUrl()
        );


        return data;
    }


    function saveAttribution() {


        const data =
            buildBaseData();


        data.set(

            'action',

            'hy_save_ads_attribution'
        );


        fetch(

            AJAX_URL,

            {

                method:
                    'POST',

                credentials:
                    'same-origin',

                headers: {

                    'Content-Type':

                        'application/x-www-form-urlencoded; charset=UTF-8'
                },

                body:
                    data.toString(),

                keepalive:
                    true
            }

        ).catch(
            function () {}
        );
    }


/* =========================================================
 * 记录 WhatsApp / Email / Form 联系行为
 * ======================================================= */

    function recordContact(
        type,
        product
    ) {


        const data =
            new URLSearchParams();


        data.set(
            'action',
            'hy_record_ads_contact'
        );


        data.set(
            'lead_ref',
            leadRef
        );


        data.set(
            'contact_type',
            type
        );


        data.set(
            'contact_product',
            product
        );


        data.set(

            'contact_page_url',

            cleanPageUrl()
        );


        if (
            navigator.sendBeacon
        ) {


            navigator.sendBeacon(

                AJAX_URL,

                new Blob(

                    [
                        data.toString()
                    ],

                    {

                        type:
                            'application/x-www-form-urlencoded; charset=UTF-8'
                    }
                )
            );


            return;
        }


        fetch(

            AJAX_URL,

            {

                method:
                    'POST',

                credentials:
                    'same-origin',

                headers: {

                    'Content-Type':

                        'application/x-www-form-urlencoded; charset=UTF-8'
                },

                body:
                    data.toString(),

                keepalive:
                    true
            }

        ).catch(
            function () {}
        );
    }


/* =========================================================
 * 判断是否为 WhatsApp 链接
 * ======================================================= */

    function isWhatsAppLink(
        href
    ) {

        return (

            /(?:wa\.me|api\.whatsapp\.com|whatsapp\.com\/send)/i

        ).test(
            href || ''
        );
    }


/* =========================================================
 * 修改 WhatsApp 链接
 * ======================================================= */

    function rewriteWhatsApp(
        link
    ) {


        if (
            !link
            ||
            !link.href
            ||
            !isWhatsAppLink(
                link.href
            )
        ) {

            return;
        }


        try {


            const ctx =
                getProductContext();


            const url =
                new URL(

                    link.href,

                    location.origin
                );


            /*
             * 最终 WhatsApp 内容：
             *
             * Hello, I need a concrete mixer pump.
             *
             * Ref: HY-260916-XXXXXX
             */

            const text =

                ctx.whatsapp

                +

                '\n\nRef: '

                +

                leadRef;


            url.searchParams.set(

                'text',

                text
            );


            link.href =
                url.toString();


        } catch (e) {}
    }


/* =========================================================
 * 修改 Email
 * ======================================================= */

    function rewriteEmail(
        link
    ) {


        if (
            !link
            ||
            !link.getAttribute(
                'href'
            )
        ) {

            return;
        }


        const href =
            link.getAttribute(
                'href'
            );


        if (
            !/^mailto:/i.test(
                href
            )
        ) {

            return;
        }


        try {


            const ctx =
                getProductContext();


            const parts =
                href.split('?');


            const emailPart =
                parts.shift();


            const qs =
                new URLSearchParams(

                    parts.join('?')
                );


            /*
             * Email 只增加 Subject，
             * 不增加正文内容
             */

            qs.set(

                'subject',

                ctx.emailSubject

                +

                ' - Ref '

                +

                leadRef
            );


            link.setAttribute(

                'href',

                emailPart

                +

                '?'

                +

                qs.toString()
            );


        } catch (e) {}
    }


/* =========================================================
 * Contact Form 7 隐藏字段自动填充
 * ======================================================= */

    function fillForms() {


        const ctx =
            getProductContext();


        const values = {


            hy_lead_ref:
                leadRef,


            gclid:
                getCookie(
                    COOKIE_PREFIX
                    +
                    'gclid'
                ),


            gbraid:
                getCookie(
                    COOKIE_PREFIX
                    +
                    'gbraid'
                ),


            wbraid:
                getCookie(
                    COOKIE_PREFIX
                    +
                    'wbraid'
                ),


            hy_contact_product:
                ctx.product,


            hy_landing_page:
                getCookie(
                    COOKIE_PREFIX
                    +
                    'landing_url'
                )
        };


        Object.keys(
            values
        ).forEach(

            function (name) {


                document
                    .querySelectorAll(

                        '[name="'
                        +
                        name
                        +
                        '"]'
                    )
                    .forEach(

                        function (el) {

                            el.value =
                                values[name]
                                ||
                                '';
                        }
                    );
            }
        );
    }


/* =========================================================
 * 扫描页面中的 WhatsApp / Email 链接
 * ======================================================= */

    function prepareLinks(
        root
    ) {


        const scope =

            root

            &&

            root.querySelectorAll

            ?

            root

            :

            document;


        scope
            .querySelectorAll(
                'a[href]'
            )
            .forEach(

                function (link) {

                    rewriteWhatsApp(
                        link
                    );

                    rewriteEmail(
                        link
                    );
                }
            );
    }


/* =========================================================
 * 页面功能初始化
 * ======================================================= */

    function bootDomFeatures() {


        prepareLinks(
            document
        );


        fillForms();


        /*
         * WhatsApp / Email 点击记录
         */

        document.addEventListener(

            'click',

            function (event) {


                const link =

                    event.target.closest

                    ?

                    event.target.closest(
                        'a[href]'
                    )

                    :

                    null;


                if (!link) {

                    return;
                }


                const href =

                    link.getAttribute(
                        'href'
                    )

                    ||

                    '';


                const ctx =
                    getProductContext();


                /*
                 * WhatsApp
                 */

                if (
                    isWhatsAppLink(
                        href
                    )
                ) {


                    rewriteWhatsApp(
                        link
                    );


                    recordContact(

                        'whatsapp',

                        ctx.product
                    );


                /*
                 * Email
                 */

                } else if (

                    /^mailto:/i.test(
                        href
                    )

                ) {


                    rewriteEmail(
                        link
                    );


                    recordContact(

                        'email',

                        ctx.product
                    );
                }

            },

            true
        );


        /*
         * Contact Form 7
         * 邮件发送成功以后记录
         */

        document.addEventListener(

            'wpcf7mailsent',

            function () {


                recordContact(

                    'form',

                    getProductContext()
                        .product
                );

            },

            false
        );


        /*
         * 支持动态加载出来的 WhatsApp 按钮
         */

        if (

            'MutationObserver'
            in
            window

            &&

            document.body

        ) {


            const observer =
                new MutationObserver(

                    function (
                        mutations
                    ) {


                        mutations.forEach(

                            function (
                                mutation
                            ) {


                                mutation
                                    .addedNodes
                                    .forEach(

                                        function (
                                            node
                                        ) {


                                            if (
                                                node.nodeType
                                                !==
                                                1
                                            ) {

                                                return;
                                            }


                                            if (

                                                node.matches

                                                &&

                                                node.matches(
                                                    'a[href]'
                                                )

                                            ) {


                                                rewriteWhatsApp(
                                                    node
                                                );


                                                rewriteEmail(
                                                    node
                                                );
                                            }


                                            prepareLinks(
                                                node
                                            );


                                            fillForms();
                                        }
                                    );
                            }
                        );
                    }
                );


            observer.observe(

                document.body,

                {

                    childList:
                        true,

                    subtree:
                        true
                }
            );
        }
    }


/* =========================================================
 * 执行
 * ======================================================= */

    saveAttribution();


    if (
        document.readyState
        ===
        'loading'
    ) {


        document.addEventListener(

            'DOMContentLoaded',

            bootDomFeatures,

            {
                once: true
            }
        );


    } else {


        bootDomFeatures();
    }


})();

</script>

<?php

    },

    1
);


/* =========================================================
 * 6. 测试 Shortcode
 *
 * 页面输入：
 *
 * [hy_lead_ref]
 *
 * 可以显示当前 HY Lead Ref
 * ======================================================= */

add_shortcode(
    'hy_lead_ref',
    function () {


        return '

        <span class="hy-lead-ref-output"></span>

        <script>

        (function(){

            function c(n){

                var p =
                    (document.cookie || "")
                    .split(";");

                for(
                    var i = 0;
                    i < p.length;
                    i++
                ){

                    var s =
                        p[i].trim();

                    var k =
                        encodeURIComponent(n)
                        +
                        "=";

                    if(
                        s.indexOf(k)
                        ===
                        0
                    ){

                        return decodeURIComponent(

                            s.substring(
                                k.length
                            )
                        );
                    }
                }

                return "";
            }


            document
                .querySelectorAll(
                    ".hy-lead-ref-output"
                )
                .forEach(

                    function(el){

                        el.textContent =
                            c(
                                "hy_lead_ref"
                            );
                    }
                );

        })();

        </script>';
    }
);


/* =========================================================
 * 7. WordPress 后台
 *
 * 工具 > Google Ads Leads
 * ======================================================= */

add_action(
    'admin_menu',
    function () {


        add_management_page(

            'Google Ads Leads',

            'Google Ads Leads',

            'manage_options',

            'hy-google-ads-leads',

            'hy_google_ads_leads_admin_page'
        );
    }
);


function hy_google_ads_leads_admin_page() {


    if (
        !current_user_can(
            'manage_options'
        )
    ) {

        return;
    }


    global $wpdb;


    $table =
        $wpdb->prefix
        .
        'hy_ads_attribution';


    $search =

        isset(
            $_GET['s']
        )

        ?

        sanitize_text_field(

            wp_unslash(
                $_GET['s']
            )
        )

        :

        '';


    if (
        $search !== ''
    ) {


        $like =

            '%'

            .

            $wpdb->esc_like(
                $search
            )

            .

            '%';


        $rows =
            $wpdb->get_results(

                $wpdb->prepare(

                    "SELECT *

                     FROM {$table}

                     WHERE

                     lead_ref LIKE %s

                     OR gclid LIKE %s

                     OR utm_campaign LIKE %s

                     OR first_product LIKE %s

                     OR contact_product LIKE %s

                     ORDER BY id DESC

                     LIMIT 200",

                    $like,

                    $like,

                    $like,

                    $like,

                    $like
                )
            );


    } else {


        $rows =
            $wpdb->get_results(

                "SELECT *

                 FROM {$table}

                 ORDER BY id DESC

                 LIMIT 200"
            );
    }

?>

<div class="wrap">


    <h1>
        Google Ads Lead Attribution
    </h1>


    <p>
        查询 HY Lead Ref 与 Google Ads 点击标识的对应关系。
    </p>


    <form
        method="get"
        style="margin:16px 0;"
    >


        <input
            type="hidden"
            name="page"
            value="hy-google-ads-leads"
        >


        <input
            type="search"
            name="s"
            value="<?php echo esc_attr($search); ?>"
            placeholder="Lead Ref / GCLID / Campaign / Product"
            style="width:380px;"
        >


        <button
            class="button button-primary"
        >
            查询
        </button>


    </form>


    <table
        class="widefat striped"
    >


        <thead>

        <tr>

            <th>
                Lead Ref
            </th>

            <th>
                Google Click ID
            </th>

            <th>
                首次产品
            </th>

            <th>
                首次落地页
            </th>

            <th>
                联系产品
            </th>

            <th>
                联系页面
            </th>

            <th>
                联系方式
            </th>

            <th>
                联系次数
            </th>

            <th>
                Campaign
            </th>

            <th>
                Term
            </th>

            <th>
                首次时间
            </th>

            <th>
                最近联系
            </th>

        </tr>

        </thead>


        <tbody>


        <?php if (!$rows): ?>


            <tr>

                <td colspan="12">
                    暂无数据。
                </td>

            </tr>


        <?php else: ?>


            <?php foreach ($rows as $row): ?>


                <?php

                $click_id =

                    $row->gclid

                    ?:

                    (
                        $row->gbraid

                        ?:

                        $row->wbraid
                    );

                ?>


                <tr>


                    <td>

                        <strong>

                            <?php
                            echo esc_html(
                                $row->lead_ref
                            );
                            ?>

                        </strong>

                    </td>


                    <td
                        style="
                        max-width:280px;
                        word-break:break-all;
                        "
                    >

                        <?php
                        echo esc_html(
                            $click_id
                        );
                        ?>

                    </td>


                    <td>

                        <?php
                        echo esc_html(
                            $row->first_product
                        );
                        ?>

                    </td>


                    <td
                        style="
                        max-width:240px;
                        word-break:break-all;
                        "
                    >

                        <?php
                        echo esc_html(
                            $row->first_landing_url
                        );
                        ?>

                    </td>


                    <td>

                        <?php
                        echo esc_html(
                            $row->contact_product
                        );
                        ?>

                    </td>


                    <td
                        style="
                        max-width:240px;
                        word-break:break-all;
                        "
                    >

                        <?php
                        echo esc_html(
                            $row->contact_page_url
                        );
                        ?>

                    </td>


                    <td>

                        <?php
                        echo esc_html(
                            $row->contact_type
                        );
                        ?>

                    </td>


                    <td>

                        <?php
                        echo esc_html(
                            $row->contact_count
                        );
                        ?>

                    </td>


                    <td>

                        <?php
                        echo esc_html(
                            $row->utm_campaign
                        );
                        ?>

                    </td>


                    <td>

                        <?php
                        echo esc_html(
                            $row->utm_term
                        );
                        ?>

                    </td>


                    <td>

                        <?php
                        echo esc_html(
                            $row->created_at
                        );
                        ?>

                    </td>


                    <td>

                        <?php
                        echo esc_html(
                            $row->contacted_at
                        );
                        ?>

                    </td>


                </tr>


            <?php endforeach; ?>


        <?php endif; ?>


        </tbody>


    </table>


</div>

<?php
}
```

## 三、WhatsApp 如何关联 GCLID

不建议直接把很长的 GCLID 放进 WhatsApp。

更好的方法是使用短 Lead ID。

例如客户在混凝土搅拌泵页面点击 WhatsApp：

```text
Hello, I need a concrete mixer pump.

Ref: HY-260916-K7P4WQ
```

如果是在固定式混凝土配料站页面，则自动变成：

```text
Hello, I need a stationary concrete batching plant.

Ref: HY-260916-K7P4WQ
```

其他产品也可以自动区分：

- Mobile Concrete Batching Plant
- Concrete Trailer Pump
- Concrete Mixer Pump
- Cement Silo

销售收到 WhatsApp 后，只需要在 WordPress 后台搜索 Lead ID，即可找到对应的 GCLID。

## 四、Email 如何关联

Email 的原理相同。

例如客户从固定式配料站页面点击邮箱，邮件标题自动变成：

```text
Stationary Concrete Batching Plant Inquiry - Ref HY-260916-K7P4WQ
```

销售收到邮件以后，通过 Ref 编号即可查询原始 GCLID。

## 五、不要把 WhatsApp 点击直接当成有效询盘

Google Ads 中建议区分：

### 次要转化

用于观察用户行为：

```text
WhatsApp Click
Email Click
```

### 主要转化

用于 Google Ads 自动优化：

```text
Qualified Lead
```

例如：

```text
200 次 WhatsApp 点击
↓
130 人真正发消息
↓
80 人属于设备询盘
↓
50 人确认有真实采购需求
```

真正应该重点回传给 Google 的，是最后的：

**50 个 Qualified Leads。**

## 六、Google Sheet 怎么做

可以创建一张：

**Google Ads Qualified Leads**

推荐字段：


| 字段              | 用途                 |
| ----------------- | -------------------- |
| Lead ID           | WordPress 生成的编号 |
| GCLID             | 广告点击 ID          |
| Conversion Action | Qualified Lead       |
| Conversion Time   | 确认有效询盘的时间   |
| Email             | 客户邮箱             |
| Phone             | 客户电话             |
| Product           | 咨询产品             |
| Country           | 客户国家             |
| Status            | Qualified            |
| Conversion Value  | 可选                 |
| Currency          | 可选                 |

示例：

```text
Lead ID:
HY-260916-K7P4WQ

GCLID:
EAIaIQobChMIxxxx

Conversion Action:
Qualified Lead - Google Ads

Conversion Time:
2026-09-16T10:35:00+08:00

Phone:
+2348012345678

Product:
Concrete Mixer Pump

Country:
Nigeria

Status:
Qualified
```

## 七、哪些客户需要加入 Google Sheet

不是所有 WhatsApp 或 Email 联系人都需要上传。

### 可以回传

```text
需要 HZS120 配料站
项目在 Nigeria
明确有采购需求
```

### 不建议回传

```text
Hello
Price?
求职
卖零件
垃圾信息
供应商推销
```

Google 最需要学习的是：

**真正可能采购设备的人。**

## 八、如何回传 Google Ads

在 Google Ads 中创建：

**Qualified Lead**

类型选择：

**线下转化 / Import**

之后通过：

**Data Manager → Google Sheets**

连接回传表。

主要映射：

```text
GCLID
→ Google Click ID

Conversion Time
→ Conversion event time

Lead ID
→ Order ID

Phone
→ Phone

Email
→ Email
```

Google Ads 就可以把这个真实客户重新匹配到原来的广告点击。

## 九、完整流程

```text
Google Ads
↓
客户点击广告
↓
网站保存 GCLID
↓
生成 HY Lead ID
↓
客户点击 WhatsApp / Email
↓
消息中自动带 Ref
↓
销售确认真实采购需求
↓
Google Sheet
↓
Qualified Lead
↓
Google Ads Data Manager
↓
回传 Google Ads
```

## 十、几个容易忘记的注意事项

1. Google Ads 必须开启 **自动标记**。
2. 最好同时保存 `gclid`、`gbraid`、`wbraid`。
3. WhatsApp 点击和真实询盘不是一回事。
4. Qualified Lead 的时间填写 **客户被确认成有效询盘的时间**，不是广告点击时间。
5. 建议定期回传，不要隔很久再统一整理。
6. `Lead ID` 最好保持唯一，方便防止重复回传。

## 总结

对于以 WhatsApp 和 Email 为主要询盘方式的 B2B 网站，只统计按钮点击是不够的。

更合理的方案是：

> **Google Ads 点击 → GCLID → Lead ID → WhatsApp / Email → Qualified Lead → 回传 Google Ads**

这样 Google Ads 学习到的就不再只是“谁愿意点击 WhatsApp”，而是：

**什么关键词、什么广告、什么国家的客户，更容易成为真正的采购询盘。**
