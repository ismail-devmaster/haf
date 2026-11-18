/*! For license information please see entrypoint.js.LICENSE.txt */
var e,t,r={8493(e,t,r){r.d(t,{IW:()=>o});var a=r(9419),s=r(4935);r(8111),r(7588),r(7642),r(5024),r(1698),r(7254),r(7036);const n=e=>(0,s.Fg)({context:e,subscribe:!0}),i=(e,t,r)=>{const a=(s={transformer:function(e){return r.call(this,e)},watch:t?[t]:[]},(e,t)=>{if("object"==typeof t)throw new Error("This decorator does not support this compilation type.");const r=String(t),a=e;if(a._transformers){if(!a.hasOwnProperty("_transformers")){const e=a._transformers;a._transformers=new Map,e.forEach((e,t)=>a._transformers.set(t,e))}}else{a._transformers=new Map,a._watching=new Map;const e=a.willUpdate;a.willUpdate=function(t){e.call(this,t);const r=new Set;t.forEach((e,t)=>{const a=this._watching.get(t);void 0!==a&&a.forEach(e=>r.add(e))}),r.forEach(e=>{this[e]=this[`__original_${String(e)}`]})}}a._transformers.set(t,s.transformer),s.watch&&s.watch.forEach(e=>{let r=a._watching.get(e);r||(r=new Set,a._watching.set(e,r)),r.add(t)});const n=Object.getOwnPropertyDescriptor(e,t);let i;if(void 0===n)i={get(){return this[`__transform_${r}`]},set(e){const t=this[`__transform_${r}`],a=this._transformers.get(r);this[`__transform_${r}`]=a?a.call(this,e):e,this[`__original_${r}`]=e,this.requestUpdate(r,t)},configurable:!0,enumerable:!0};else{const e=n.set;i={...n,set(t){const a=this[`__transform_${r}`],s=this._transformers.get(r);this[`__transform_${r}`]=s?s.call(this,t):t,this[`__original_${r}`]=t,this.requestUpdate(r,a),e?.call(this,t)}}}Object.defineProperty(e,t,i)});var s;const i=n(e);return(e,t)=>{a(e,t),i(e,t)}},o=()=>i(a.D5,void 0,({localize:e})=>e)},4935(e,t,r){r.d(t,{Fg:()=>n});r(8111),r(7588),r(805),r(3525);var a=r(462);class s{hostConnected(){this._host.dispatchEvent(new a.O2(this._context,this._host,this._callback,this._subscribe))}hostDisconnected(){this._unsubscribe?.(),this._unsubscribe=void 0}constructor(e,t,r,a=!0){this._host=e,this._context=t,this._assign=r,this._subscribe=a,this._callback=(e,t)=>{this._unsubscribe&&this._unsubscribe!==t&&this._unsubscribe(),this._subscribe?this._unsubscribe=t:(t?.(),this._unsubscribe=void 0),this._assign(e)},this._host.addController(this)}}const n=({context:e,subscribe:t=!1})=>(r,a)=>{if("object"==typeof a)throw new Error("This decorator does not support this compilation type.");r.constructor.addInitializer(r=>{new s(r,e,e=>{r[a]=e},t)})};new WeakMap},894(e,t,r){r.d(t,{r:()=>a});const a=(e,t,r,a)=>{a=a||{},r=r??{};const s=new Event(t,{bubbles:void 0===a.bubbles||a.bubbles,cancelable:Boolean(a.cancelable),composed:void 0===a.composed||a.composed});return s.detail=r,e.dispatchEvent(s),s}},5869(e,t,r){r.d(t,{c:()=>o});const a="֑-߿יִ-﷽ﹰ-ﻼ",s="A-Za-zÀ-ÖØ-öø-ʸ̀-֐ࠀ-῿‎Ⰰ-﬜︀-﹯﻽-￿",n=new RegExp(`^[^${s}]*[${a}]`),i=new RegExp(`^[^${a}]*[${s}]`);function o(e){const t=String(e||"");return n.test(t)?"rtl":i.test(t)?"ltr":"neutral"}},6779(e,t,r){r.a(e,async function(e,t){try{var a=r(3609),s=r(7983),n=r(8292),i=r(6037),o=r(5869),l=r(8493),c=r(894),d=r(3197),u=(r(1633),e([d]));d=(u.then?(await u)():u)[0];const h="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z",p={info:"M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z",warning:"M12,2L1,21H23M12,6L19.53,19H4.47M11,10V14H13V10M11,16V18H13V16",error:"M11,15H13V17H11V15M11,7H13V13H11V7M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20Z",success:"M20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4C12.76,4 13.5,4.11 14.2,4.31L15.77,2.74C14.61,2.26 13.34,2 12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12M7.91,10.08L6.5,11.5L11,16L21,6L19.59,4.58L11,13.17L7.91,10.08Z"};class f extends s.WF{render(){return s.qy`
      <div
        class="issue-type ${(0,i.H)({[this.alertType]:!0,ltr:"rtl"!==(0,o.c)(this.title)})}"
        role="alert"
      >
        <div class="icon ${this.title?"":"no-title"}">
          <slot name="icon">
            <ha-svg-icon .path=${p[this.alertType]}></ha-svg-icon>
          </slot>
        </div>
        <div class=${(0,i.H)({content:!0,narrow:this.narrow})}>
          <div class="main-content">
            ${this.title?s.qy`<div class="title">${this.title}</div>`:s.s6}
            <slot></slot>
          </div>
          <div class="action">
            <slot name="action">
              ${this.dismissable?s.qy`<ha-icon-button
                      @click=${this._dismissClicked}
                      .label=${this._localize?.("ui.common.dismiss_alert")}
                      .path=${h}
                    ></ha-icon-button>`:s.s6}
            </slot>
          </div>
        </div>
      </div>
    `}_dismissClicked(){(0,c.r)(this,"alert-dismissed-clicked")}constructor(...e){super(...e),this.title="",this.alertType="info",this.dismissable=!1,this.narrow=!1}}f.styles=s.AH`
    .issue-type {
      position: relative;
      padding: var(--ha-alert-padding, 8px);
      display: flex;
    }
    .icon {
      height: var(--ha-alert-icon-size, 24px);
      width: var(--ha-alert-icon-size, 24px);
    }
    .issue-type::after {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      opacity: 0.12;
      pointer-events: none;
      content: "";
      border-radius: var(--ha-border-radius-sm);
    }
    .icon.no-title {
      align-self: center;
    }
    .content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      text-align: var(--float-start);
    }
    .content.narrow {
      flex-direction: column;
      align-items: flex-end;
    }
    .action {
      z-index: 1;
      width: min-content;
      --mdc-theme-primary: var(--primary-text-color);
    }
    .main-content {
      overflow-wrap: anywhere;
      word-break: break-word;
      line-height: normal;
      margin-left: 8px;
      margin-right: 0;
      margin-inline-start: 8px;
      margin-inline-end: 8px;
    }
    .title {
      margin-top: 2px;
      font-weight: var(--ha-font-weight-bold);
    }
    .action ha-icon-button {
      --mdc-theme-primary: var(--primary-text-color);
      --ha-icon-button-size: 36px;
    }
    .issue-type.info > .icon {
      color: var(--info-color);
    }
    .issue-type.info::after {
      background-color: var(--info-color);
    }

    .issue-type.warning > .icon {
      color: var(--warning-color);
    }
    .issue-type.warning::after {
      background-color: var(--warning-color);
    }

    .issue-type.error > .icon {
      color: var(--error-color);
    }
    .issue-type.error::after {
      background-color: var(--error-color);
    }

    .issue-type.success > .icon {
      color: var(--success-color);
    }
    .issue-type.success::after {
      background-color: var(--success-color);
    }
    :host ::slotted(ul) {
      margin: 0;
      padding-inline-start: 20px;
    }
    .ltr {
      direction: ltr;
    }
  `,(0,a.Cg)([(0,n.MZ)()],f.prototype,"title",void 0),(0,a.Cg)([(0,n.MZ)({attribute:"alert-type"})],f.prototype,"alertType",void 0),(0,a.Cg)([(0,n.MZ)({type:Boolean})],f.prototype,"dismissable",void 0),(0,a.Cg)([(0,n.wk)(),(0,l.IW)()],f.prototype,"_localize",void 0),(0,a.Cg)([(0,n.MZ)({type:Boolean})],f.prototype,"narrow",void 0),f=(0,a.Cg)([(0,n.EM)("ha-alert")],f),t()}catch(e){t(e)}})},1905(e,t,r){r.a(e,async function(e,t){try{var a=r(3609),s=r(5171),n=r(7983),i=r(8292),o=e([s]);s=(o.then?(await o)():o)[0];class l extends s.A{static get styles(){return[s.A.styles,n.AH`
        :host {
          --wa-form-control-padding-inline: var(--ha-space-4);
          --wa-font-weight-action: var(--ha-font-weight-medium);
          --wa-form-control-border-radius: var(
            --ha-button-border-radius,
            var(--ha-border-radius-pill)
          );

          --wa-form-control-height: var(
            --ha-button-height,
            var(--button-height, 40px)
          );
        }
        .button {
          font-size: var(--ha-font-size-m);
          line-height: 1;
          -webkit-tap-highlight-color: transparent;

          transition: background-color var(--ha-animation-duration-fast)
            ease-out;
          text-wrap: wrap;
          box-shadow: var(--ha-button-box-shadow);
        }

        :host([size="xs"]) .button {
          --wa-form-control-height: var(
            --ha-button-height,
            var(--button-height, 24px)
          );
          font-size: var(--ha-font-size-m);
          --wa-form-control-padding-inline: var(--ha-space-2);
        }

        /* A default 24px icon would fill the whole xs button. */
        :host([size="xs"]) slot[name="start"]::slotted(*),
        :host([size="xs"]) slot[name="end"]::slotted(*) {
          --mdc-icon-size: 16px;
        }

        :host([size="s"]) .button {
          --wa-form-control-height: var(
            --ha-button-height,
            var(--button-height, 32px)
          );
          font-size: var(--ha-font-size-m);
          --wa-form-control-padding-inline: var(--ha-space-3);
        }

        :host([size="l"]) .button {
          --wa-form-control-height: var(
            --ha-button-height,
            var(--button-height, 48px)
          );
          font-size: var(--ha-font-size-l);
        }

        :host([variant="brand"]) {
          --button-color-fill-normal-active: var(
            --ha-color-fill-primary-normal-active
          );
          --button-color-fill-normal-hover: var(
            --ha-color-fill-primary-normal-hover
          );
          --button-color-fill-loud-active: var(
            --ha-color-fill-primary-loud-active
          );
          --button-color-fill-loud-hover: var(
            --ha-color-fill-primary-loud-hover
          );
          --button-color-fill-quiet-active: var(
            --ha-color-fill-primary-quiet-active
          );
        }

        :host([variant="neutral"]) {
          --button-color-fill-normal-active: var(
            --ha-color-fill-neutral-normal-active
          );
          --button-color-fill-normal-hover: var(
            --ha-color-fill-neutral-normal-hover
          );
          --button-color-fill-loud-active: var(
            --ha-color-fill-neutral-loud-active
          );
          --button-color-fill-loud-hover: var(
            --ha-color-fill-neutral-loud-hover
          );
          --button-color-fill-quiet-active: var(
            --ha-color-fill-neutral-normal-active
          );
        }

        :host([variant="success"]) {
          --button-color-fill-normal-active: var(
            --ha-color-fill-success-normal-active
          );
          --button-color-fill-normal-hover: var(
            --ha-color-fill-success-normal-hover
          );
          --button-color-fill-loud-active: var(
            --ha-color-fill-success-loud-active
          );
          --button-color-fill-loud-hover: var(
            --ha-color-fill-success-loud-hover
          );
          --button-color-fill-quiet-active: var(
            --ha-color-fill-success-quiet-active
          );
        }

        :host([variant="warning"]) {
          --button-color-fill-normal-active: var(
            --ha-color-fill-warning-normal-active
          );
          --button-color-fill-normal-hover: var(
            --ha-color-fill-warning-normal-hover
          );
          --button-color-fill-loud-active: var(
            --ha-color-fill-warning-loud-active
          );
          --button-color-fill-loud-hover: var(
            --ha-color-fill-warning-loud-hover
          );
          --button-color-fill-quiet-active: var(
            --ha-color-fill-warning-quiet-active
          );
        }

        :host([variant="danger"]) {
          --button-color-fill-normal-active: var(
            --ha-color-fill-danger-normal-active
          );
          --button-color-fill-normal-hover: var(
            --ha-color-fill-danger-normal-hover
          );
          --button-color-fill-loud-active: var(
            --ha-color-fill-danger-loud-active
          );
          --button-color-fill-loud-hover: var(
            --ha-color-fill-danger-loud-hover
          );
          --button-color-fill-quiet-active: var(
            --ha-color-fill-danger-quiet-active
          );
        }

        :host([appearance~="plain"]) .button {
          color: var(--wa-color-on-normal);
          background-color: transparent;
        }
        :host([appearance~="plain"]) .button.disabled {
          background-color: transparent;
          color: var(--ha-color-on-disabled-quiet);
        }

        :host([appearance~="outlined"]) .button.disabled {
          background-color: transparent;
          color: var(--ha-color-on-disabled-quiet);
          border-color: var(--ha-color-on-disabled-quiet);
        }

        @media (hover: hover) {
          :host([appearance~="filled"])
            .button:not(.disabled):not(.loading):hover {
            background-color: var(--button-color-fill-normal-hover);
          }
          :host([appearance~="accent"])
            .button:not(.disabled):not(.loading):hover {
            background-color: var(--button-color-fill-loud-hover);
          }
          :host([appearance~="plain"])
            .button:not(.disabled):not(.loading):hover {
            color: var(--wa-color-on-normal);
          }
        }
        :host([appearance~="filled"]) .button {
          color: var(--wa-color-on-normal);
          background-color: var(--wa-color-fill-normal);
          border-color: transparent;
        }
        :host([appearance~="filled"])
          .button:not(.disabled):not(.loading):active {
          background-color: var(--button-color-fill-normal-active);
        }
        :host([appearance~="filled"]) .button.disabled {
          background-color: var(--ha-color-fill-disabled-normal-resting);
          color: var(--ha-color-on-disabled-normal);
        }
        :host([appearance~="plain"])
          .button:not(.disabled):not(.loading):active {
          background-color: var(--button-color-fill-quiet-active);
        }

        :host([appearance~="accent"]) .button {
          background-color: var(
            --wa-color-fill-loud,
            var(--wa-color-neutral-fill-loud)
          );
        }
        :host([appearance~="accent"])
          .button:not(.disabled):not(.loading):active {
          background-color: var(--button-color-fill-loud-active);
        }
        :host([appearance~="accent"]) .button.disabled {
          background-color: var(--ha-color-fill-disabled-loud-resting);
          color: var(--ha-color-on-disabled-loud);
        }

        :host([loading]) {
          pointer-events: none;
        }

        .button.disabled {
          opacity: 1;
        }

        slot[name="start"]::slotted(*) {
          margin-inline-end: var(--ha-space-1);
        }
        slot[name="end"]::slotted(*) {
          margin-inline-start: var(--ha-space-1);
        }

        .button.has-start {
          padding-inline-start: var(--ha-space-2);
        }
        .button.has-end {
          padding-inline-end: var(--ha-space-2);
        }

        .label {
          overflow: var(--ha-button-label-overflow, hidden);
          text-overflow: ellipsis;
          padding: var(--ha-space-1) 0;
        }
      `]}constructor(...e){super(...e),this.variant="brand"}}l=(0,a.Cg)([(0,i.EM)("ha-button")],l),t()}catch(e){t(e)}})},9939(e,t,r){var a=r(3609),s=r(7983),n=r(8292);class i extends s.WF{render(){return s.qy`
      ${this.header?s.qy`<h1 class="card-header">${this.header}</h1>`:s.s6}
      <slot></slot>
    `}constructor(...e){super(...e),this.raised=!1}}i.styles=s.AH`
    :host {
      background: var(
        --ha-card-background,
        var(--card-background-color, #ffffff)
      );
      backdrop-filter: var(--ha-card-backdrop-filter, none);
      box-shadow: var(
        --ha-card-box-shadow,
        0 2px 4px 0 rgba(0, 0, 0, 0.08),
        0 4px 8px -2px rgba(0, 0, 0, 0.06)
      );
      box-sizing: border-box;
      border-radius: var(--ha-card-border-radius, 24px);
      border: var(--ha-card-border, 1px solid rgba(0, 0, 0, 0.06));
      color: var(--primary-text-color);
      display: block;
      transition:
        box-shadow 200ms ease,
        transform 200ms ease;
      position: relative;
      will-change: transform;
    }

    :host(:hover) {
      box-shadow:
        0 4px 12px 0 rgba(0, 0, 0, 0.08),
        0 2px 4px -2px rgba(0, 0, 0, 0.05);
    }

    :host([raised]) {
      border: var(--ha-card-border, 1px solid rgba(0, 0, 0, 0.06));
      box-shadow: var(
        --ha-card-box-shadow,
        0 4px 12px 0 rgba(0, 0, 0, 0.06),
        0 2px 4px -2px rgba(0, 0, 0, 0.04)
      );
    }

    :host([raised]:hover) {
      box-shadow:
        0 6px 20px 0 rgba(0, 0, 0, 0.1),
        0 3px 6px -3px rgba(0, 0, 0, 0.06);
    }

    .card-header,
    :host ::slotted(.card-header) {
      color: var(--ha-card-header-color, var(--primary-text-color));
      font-family: var(
        --ha-card-header-font-family,
        "Google Sans",
        "Product Sans",
        var(--ha-font-family-heading, inherit)
      );
      font-size: var(--ha-card-header-font-size, 18px);
      letter-spacing: -0.01em;
      line-height: 1.4;
      padding: 20px 20px 8px;
      display: block;
      margin-block-start: 0;
      margin-block-end: 0;
      font-weight: 500;
    }

    :host ::slotted(.card-content) {
      padding: 16px 20px;
    }

    :host ::slotted(.card-content:first-child) {
      padding-top: 20px;
    }

    :host ::slotted(.card-content:last-child) {
      padding-bottom: 20px;
    }

    :host ::slotted(.card-actions) {
      border-top: 1px solid rgba(0, 0, 0, 0.06);
      padding: 12px 16px;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
  `,(0,a.Cg)([(0,n.MZ)()],i.prototype,"header",void 0),(0,a.Cg)([(0,n.MZ)({type:Boolean,reflect:!0})],i.prototype,"raised",void 0),i=(0,a.Cg)([(0,n.EM)("ha-card")],i)},3197(e,t,r){r.a(e,async function(e,t){try{var a=r(3609),s=r(7983),n=r(8292),i=r(5287),o=r(1905),l=(r(1633),e([o]));o=(l.then?(await l)():l)[0];class c extends s.WF{render(){return s.qy`
      <ha-button
        appearance="plain"
        variant="neutral"
        .accessibleLabel=${this.label??""}
        .title=${this.hideTitle?"":this.label??""}
        aria-haspopup=${(0,i.J)(this.ariaHasPopup)}
        .disabled=${this.disabled}
        .iconTag=${this.path?"ha-svg-icon":"span"}
        .href=${this.href}
        .target=${this.target}
        .rel=${this.rel}
        .download=${this.download}
      >
        ${this.path?s.qy`<ha-svg-icon
                aria-hidden="true"
                .path=${this.path}
              ></ha-svg-icon>`:s.qy`<span><slot></slot></span>`}
      </ha-button>
    `}constructor(...e){super(...e),this.disabled=!1,this.hideTitle=!1,this.selected=!1}}c.shadowRootOptions={mode:"open",delegatesFocus:!0},c.styles=s.AH`
    :host {
      display: inline-block;
      outline: none;
      --ha-button-height: var(--ha-icon-button-size, 48px);
    }
    ha-button {
      position: relative;
      isolation: isolate;
      --wa-form-control-padding-inline: var(
        --ha-icon-button-padding-inline,
        --ha-space-2
      );
      --wa-color-on-normal: currentColor;
      --wa-color-fill-quiet: transparent;
      --ha-button-label-overflow: visible;
    }
    ha-button::after {
      content: "";
      position: absolute;
      inset: 0;
      z-index: -1;
      border-radius: 50%;
      background-color: currentColor;
      opacity: 0;
      pointer-events: none;
    }
    ha-button::part(base) {
      width: var(--wa-form-control-height);
      aspect-ratio: 1;
      outline-offset: -4px;
    }
    ha-button::part(label) {
      display: flex;
    }
    :host([selected]) ha-button::after {
      opacity: 0.1;
    }

    @media (hover: hover) {
      :host(:hover:not([disabled])) ha-button::after {
        opacity: 0.1;
      }
    }
  `,(0,a.Cg)([(0,n.MZ)({type:Boolean,reflect:!0})],c.prototype,"disabled",void 0),(0,a.Cg)([(0,n.MZ)({type:String})],c.prototype,"path",void 0),(0,a.Cg)([(0,n.MZ)({type:String})],c.prototype,"label",void 0),(0,a.Cg)([(0,n.MZ)({type:String,attribute:"aria-haspopup"})],c.prototype,"ariaHasPopup",void 0),(0,a.Cg)([(0,n.MZ)({attribute:"hide-title",type:Boolean})],c.prototype,"hideTitle",void 0),(0,a.Cg)([(0,n.MZ)({type:Boolean,reflect:!0})],c.prototype,"selected",void 0),(0,a.Cg)([(0,n.MZ)()],c.prototype,"href",void 0),(0,a.Cg)([(0,n.MZ)()],c.prototype,"target",void 0),(0,a.Cg)([(0,n.MZ)()],c.prototype,"rel",void 0),(0,a.Cg)([(0,n.MZ)()],c.prototype,"download",void 0),c=(0,a.Cg)([(0,n.EM)("ha-icon-button")],c),t()}catch(e){t(e)}})},2725(e,t,r){r(4423);var a=r(3609),s=r(7983),n=r(8292),i=r(894);const o=window;"customIconsets"in o||(o.customIconsets={});const l=o.customIconsets,c=window;"customIcons"in c||(c.customIcons={});const d={getIcon:async()=>({path:"M12,18H6V14H12M21,14V12L20,7H4L3,12V14H4V20H14V14H18V20H20V14M20,4H4V6H20V4Z"})},u=new Proxy(c.customIcons,{get:(e,t)=>e[t]??(l[t]?{getIcon:l[t]}:void 0)??("hacs"===t?d:void 0)});r(8111),r(7588),r(1701);function h(e){return new Promise((t,r)=>{e.oncomplete=e.onsuccess=()=>t(e.result),e.onabort=e.onerror=()=>r(e.error)})}function p(e,t){let r;return(a,s)=>(()=>{if(r)return r;const a=indexedDB.open(e);return a.onupgradeneeded=()=>a.result.createObjectStore(t),r=h(a),r.then(e=>{e.onclose=()=>r=void 0},()=>{}),r})().then(e=>s(e.transaction(t,a).objectStore(t)))}let f;function v(){return f||(f=p("keyval-store","keyval")),f}function m(e,t,r=v()){return r("readwrite",r=>(r.put(t,e),h(r.transaction)))}class g extends Error{constructor(e,...t){super(...t),Error.captureStackTrace&&Error.captureStackTrace(this,g),this.name="TimeoutError",this.timeout=e,this.message=`Timed out in ${e} ms.`}}const _=JSON.parse('{"version":"7.4.47","parts":[{"file":"7a7139d465f1f41cb26ab851a17caa21a9331234"},{"start":"account-supervisor-circle-","file":"9561286c4c1021d46b9006596812178190a7cc1c"},{"start":"alpha-r-c","file":"eb466b7087fb2b4d23376ea9bc86693c45c500fa"},{"start":"arrow-decision-o","file":"4b3c01b7e0723b702940c5ac46fb9e555646972b"},{"start":"baby-f","file":"2611401d85450b95ab448ad1d02c1a432b409ed2"},{"start":"battery-hi","file":"89bcd31855b34cd9d31ac693fb073277e74f1f6a"},{"start":"blur-r","file":"373709cd5d7e688c2addc9a6c5d26c2d57c02c48"},{"start":"briefcase-account-","file":"a75956cf812ee90ee4f656274426aafac81e1053"},{"start":"calendar-question-","file":"3253f2529b5ebdd110b411917bacfacb5b7063e6"},{"start":"car-lig","file":"74566af3501ad6ae58ad13a8b6921b3cc2ef879d"},{"start":"cellphone-co","file":"7677f1cfb2dd4f5562a2aa6d3ae43a2e6997b21a"},{"start":"circle-slice-2","file":"70d08c50ec4522dd75d11338db57846588263ee2"},{"start":"cloud-co","file":"141d2bfa55ca4c83f4bae2812a5da59a84fec4ff"},{"start":"cog-s","file":"5a640365f8e47c609005d5e098e0e8104286d120"},{"start":"cookie-l","file":"dd85b8eb8581b176d3acf75d1bd82e61ca1ba2fc"},{"start":"currency-eur-","file":"15362279f4ebfc3620ae55f79d2830ad86d5213e"},{"start":"delete-o","file":"239434ab8df61237277d7599ebe066c55806c274"},{"start":"draw-","file":"5605918a592070803ba2ad05a5aba06263da0d70"},{"start":"emoticon-po","file":"a838cfcec34323946237a9f18e66945f55260f78"},{"start":"fan","file":"effd56103b37a8c7f332e22de8e4d67a69b70db7"},{"start":"file-question-","file":"b2424b50bd465ae192593f1c3d086c5eec893af8"},{"start":"flask-off-","file":"3b76295cde006a18f0301dd98eed8c57e1d5a425"},{"start":"food-s","file":"1c6941474cbeb1755faaaf5771440577f4f1f9c6"},{"start":"gamepad-u","file":"c6efe18db6bc9654ae3540c7dee83218a5450263"},{"start":"google-f","file":"df341afe6ad4437457cf188499cb8d2df8ac7b9e"},{"start":"head-c","file":"282121c9e45ed67f033edcc1eafd279334c00f46"},{"start":"home-pl","file":"27e8e38fc7adcacf2a210802f27d841b49c8c508"},{"start":"inbox-","file":"0f0316ec7b1b7f7ce3eaabce26c9ef619b5a1694"},{"start":"key-v","file":"ea33462be7b953ff1eafc5dac2d166b210685a60"},{"start":"leaf-circle-","file":"33db9bbd66ce48a2db3e987fdbd37fb0482145a4"},{"start":"lock-p","file":"b89e27ed39e9d10c44259362a4b57f3c579d3ec8"},{"start":"message-s","file":"7b5ab5a5cadbe06e3113ec148f044aa701eac53a"},{"start":"moti","file":"01024d78c248d36805b565e343dd98033cc3bcaf"},{"start":"newspaper-variant-o","file":"22a6ec4a4fdd0a7c0acaf805f6127b38723c9189"},{"start":"on","file":"c73d55b412f394e64632e2011a59aa05e5a1f50d"},{"start":"paw-ou","file":"3f669bf26d16752dc4a9ea349492df93a13dcfbf"},{"start":"pigg","file":"0c24edb27eb1c90b6e33fc05f34ef3118fa94256"},{"start":"printer-pos-sy","file":"41a55cda866f90b99a64395c3bb18c14983dcf0a"},{"start":"read","file":"c7ed91552a3a64c9be88c85e807404cf705b7edf"},{"start":"robot-vacuum-variant-o","file":"917d2a35d7268c0ea9ad9ecab2778060e19d90e0"},{"start":"sees","file":"6e82d9861d8fac30102bafa212021b819f303bdb"},{"start":"shoe-f","file":"e2fe7ce02b5472301418cc90a0e631f187b9f238"},{"start":"snowflake-m","file":"a28ba9f5309090c8b49a27ca20ff582a944f6e71"},{"start":"st","file":"7e92d03f095ec27e137b708b879dfd273bd735ab"},{"start":"su","file":"61c74913720f9de59a379bdca37f1d2f0dc1f9db"},{"start":"tag-plus-","file":"8f3184156a4f38549cf4c4fffba73a6a941166ae"},{"start":"timer-a","file":"baab470d11cfb3a3cd3b063ee6503a77d12a80d0"},{"start":"transit-d","file":"8561c0d9b1ac03fab360fd8fe9729c96e8693239"},{"start":"vector-arrange-b","file":"c9a3439257d4bab33d3355f1f2e11842e8171141"},{"start":"water-ou","file":"02dbccfb8ca35f39b99f5a085b095fc1275005a0"},{"start":"webc","file":"57bafd4b97341f4f2ac20a609d023719f23a619c"},{"start":"zip","file":"65ae094e8263236fa50486584a08c03497a38d93"}]}');let y;const b=()=>(y||(y=w().catch(e=>{throw y=void 0,e})),y),w=async()=>{const e=p("hass-icon-db","mdi-icon-store"),t=await function(e,t=v()){return t("readonly",t=>h(t.get(e)))}("_version",e);return t?t!==_.version&&(await function(e=v()){return e("readwrite",e=>(e.clear(),h(e.transaction)))}(e),m("_version",_.version,e)):m("_version",_.version,e),e},C=["mdi","hass","hassio","hademo"];let x=[];const k=e=>new Promise((t,r)=>{if(x.push([e,t,r]),x.length>1)return;const a=b();((e,t)=>{const r=new Promise((t,r)=>{setTimeout(()=>{r(new g(e))},e)});return Promise.race([t,r])})(1e3,(async()=>{(await a)("readonly",e=>{for(const[t,r,a]of x)h(e.get(t)).then(e=>r(e)).catch(e=>a(e));x=[]})})()).catch(e=>{for(const[,,t]of x)t(e);x=[]})});r(1633);const L={},A={},M=((e,t,r=!1)=>{let a,s;const n=(...n)=>{const i=r&&!a;a&&(s=n),clearTimeout(a),a=window.setTimeout(()=>{a=void 0,s?(e(...s),s=void 0):r||e(...n)},t),i&&e(...n)};return n.cancel=()=>{clearTimeout(a),a=void 0,s=void 0},n})(()=>(async e=>{const t=Object.keys(e),r=await Promise.allSettled(Object.values(e));(await b())("readwrite",a=>{r.forEach((r,s)=>{"fulfilled"===r.status&&Object.entries(r.value).forEach(([e,t])=>{a.put(t,e)}),delete e[t[s]]})})})(A),2e3),S={},E={"home-assistant":()=>r.e("src_resources_home-assistant-logo-svg_ts").then(r.bind(r,317)).then(e=>e.mdiHomeAssistant),"music-assistant":()=>r.e("src_resources_music-assistant-logo-svg_ts").then(r.bind(r,3060)).then(e=>e.mdiMusicAssistant),esphome:()=>r.e("src_resources_esphome-logo-svg_ts").then(r.bind(r,9744)).then(e=>e.mdiEsphomeLogo),matter:()=>r.e("src_resources_matter-logo-svg_ts").then(r.bind(r,3344)).then(e=>e.mdiMatterLogo),mqtt:()=>r.e("src_resources_mqtt-logo-svg_ts").then(r.bind(r,2017)).then(e=>e.mdiMqttLogo)};class $ extends s.WF{willUpdate(e){super.willUpdate(e),e.has("icon")&&(this._path=void 0,this._secondaryPath=void 0,this._viewBox=void 0,this._loadIcon())}render(){return this.icon?this._legacy?s.qy`<!-- @ts-ignore we don't provide the iron-icon element -->
        <iron-icon .icon=${this.icon}></iron-icon>`:s.qy`<ha-svg-icon
      .path=${this._path}
      .secondaryPath=${this._secondaryPath}
      .viewBox=${this._viewBox}
    ></ha-svg-icon>`:s.s6}async _loadIcon(){if(!this.icon)return;const e=this.icon,[t,r]=this.icon.split(":",2);let a,s=r;if(!t||!s)return;if(!C.includes(t)){const r=u[t];return r?void(r&&"function"==typeof r.getIcon&&this._setCustomPath(r.getIcon(s),e)):void(this._legacy=!0)}if(this._legacy=!1,s in L){const e=L[s];let r;e.newName?(r=`Icon ${t}:${s} was renamed to ${t}:${e.newName}, please change your config, it will be removed in version ${e.removeIn}.`,s=e.newName):r=`Icon ${t}:${s} was removed from MDI, please replace this icon with an other icon in your config, it will be removed in version ${e.removeIn}.`,console.warn(r),(0,i.r)(this,"write_log",{level:"warning",message:r})}if(s in S)return void(this._path=S[s]);if(s in E){const t=await E[s]();return this.icon===e&&(this._path=t),void(S[s]=t)}try{a=await k(s)}catch(e){a=void 0}if(a)return this.icon===e&&(this._path=a),void(S[s]=a);const n=(e=>{let t;for(const r of _.parts){if(void 0!==r.start&&e<r.start)break;t=r}return t.file})(s);if(n in A)return void this._setPath(A[n],s,e);const o=fetch(`/static/mdi/${n}.json`).then(e=>e.json());A[n]=o,this._setPath(o,s,e),o.catch(()=>{delete A[n]}),M()}async _setCustomPath(e,t){const r=await e;this.icon===t&&(this._path=r.path,this._secondaryPath=r.secondaryPath,this._viewBox=r.viewBox)}async _setPath(e,t,r){try{const a=await e;this.icon===r&&(this._path=a[t]),S[t]=a[t]}catch(e){}}constructor(...e){super(...e),this._legacy=!1}}$.styles=s.AH`
    :host {
      fill: currentcolor;
    }
  `,(0,a.Cg)([(0,n.MZ)()],$.prototype,"icon",void 0),(0,a.Cg)([(0,n.wk)()],$.prototype,"_path",void 0),(0,a.Cg)([(0,n.wk)()],$.prototype,"_secondaryPath",void 0),(0,a.Cg)([(0,n.wk)()],$.prototype,"_viewBox",void 0),(0,a.Cg)([(0,n.wk)()],$.prototype,"_legacy",void 0),$=(0,a.Cg)([(0,n.EM)("ha-icon")],$)},1633(e,t,r){var a=r(3609),s=r(7983),n=r(8292);class i extends s.WF{render(){return s.JW`
    <svg
      viewBox=${this.viewBox||"0 0 24 24"}
      preserveAspectRatio="xMidYMid meet"
      focusable="false"
      role="img"
      aria-hidden="true"
    >
      <g>
        ${this.path?s.JW`<path class="primary-path" d=${this.path}></path>`:s.s6}
        ${this.secondaryPath?s.JW`<path class="secondary-path" d=${this.secondaryPath}></path>`:s.s6}
      </g>
    </svg>`}}i.styles=s.AH`
    :host {
      display: var(--ha-icon-display, inline-flex);
      align-items: center;
      justify-content: center;
      position: relative;
      vertical-align: middle;
      fill: var(--icon-primary-color, currentcolor);
      width: var(--mdc-icon-size, 24px);
      height: var(--mdc-icon-size, 24px);
    }
    svg {
      width: 100%;
      height: 100%;
      pointer-events: none;
      display: block;
    }
    path.primary-path {
      opacity: var(--icon-primary-opactity, 1);
    }
    path.secondary-path {
      fill: var(--icon-secondary-color, currentcolor);
      opacity: var(--icon-secondary-opactity, 0.5);
    }
  `,(0,a.Cg)([(0,n.MZ)()],i.prototype,"path",void 0),(0,a.Cg)([(0,n.MZ)({attribute:!1})],i.prototype,"secondaryPath",void 0),(0,a.Cg)([(0,n.MZ)({attribute:!1})],i.prototype,"viewBox",void 0),i=(0,a.Cg)([(0,n.EM)("ha-svg-icon")],i)},2833(e,t,r){r.a(e,async function(e,t){try{var a=r(3609),s=r(6882),n=r(7983),i=r(8292),o=e([s]);s=(o.then?(await o)():o)[0];class l extends s.A{willUpdate(e){if(super.willUpdate(e),e.has("size"))switch(this.size){case"tiny":this.style.setProperty("--ha-progress-ring-size","16px");break;case"small":this.style.setProperty("--ha-progress-ring-size","28px");break;case"medium":this.style.setProperty("--ha-progress-ring-size","48px");break;case"large":this.style.setProperty("--ha-progress-ring-size","68px");break;case void 0:this.style.removeProperty("--ha-progress-ring-size")}}static get styles(){return[s.A.styles,n.AH`
        :host {
          --indicator-color: var(
            --ha-progress-ring-indicator-color,
            var(--primary-color)
          );
          --track-color: var(
            --ha-progress-ring-divider-color,
            var(--divider-color)
          );
          --track-width: 4px;
          --speed: 3.5s;
          --size: var(--ha-progress-ring-size, 48px);
        }
      `]}}(0,a.Cg)([(0,i.MZ)()],l.prototype,"size",void 0),l=(0,a.Cg)([(0,i.EM)("ha-progress-ring")],l),t()}catch(e){t(e)}})},9419(e,t,r){r.d(t,{D5:()=>s,WF:()=>n});var a=r(462);(0,a.q6)("hassRegistries"),(0,a.q6)("states"),(0,a.q6)("services");const s=(0,a.q6)("hassInternationalization"),n=((0,a.q6)("hassApi"),(0,a.q6)("hassConnection"),(0,a.q6)("hassUi"),(0,a.q6)("hassConfig"));(0,a.q6)("hassFormatters"),(0,a.q6)("entities"),(0,a.q6)("devices"),(0,a.q6)("areas"),(0,a.q6)("floors"),(0,a.q6)("narrowViewport"),(0,a.q6)("reducedMotion"),(0,a.q6)("brandsAccessToken"),(0,a.q6)("labels"),(0,a.q6)("extendedEntities"),(0,a.q6)("configEntries"),(0,a.q6)("manifests"),(0,a.q6)("triggerDescriptions"),(0,a.q6)("conditionDescriptions"),(0,a.q6)("connection"),(0,a.q6)("localize"),(0,a.q6)("locale"),(0,a.q6)("config"),(0,a.q6)("themes"),(0,a.q6)("selectedTheme"),(0,a.q6)("user"),(0,a.q6)("userData"),(0,a.q6)("panels"),(0,a.q6)("auth"),(0,a.q6)("related")},7879(e,t,r){r.d(t,{Nr:()=>n,Uh:()=>s,jw:()=>a});async function a(e){const t=e?.user,r=t?.id||null,a=Boolean(t?.is_admin),s=Boolean(t?.is_owner);if(!r||!e?.connection||"function"!=typeof e?.callWS)return{userId:r,role:"user",isFather:!1,isAdmin:a,isOwner:s,hasNoDomoluxRole:!0,fatherAssigned:!1,available:!1};try{const t=await e.callWS({type:"domolux/role/get"}),n=Boolean(t?.is_father)&&!a&&!s;return{userId:r,role:n?"father":"user",isFather:n,isAdmin:a,isOwner:s,hasNoDomoluxRole:!n,fatherAssigned:Boolean(t?.father_assigned),available:!0}}catch(e){return{userId:r,role:"user",isFather:!1,isAdmin:a,isOwner:s,hasNoDomoluxRole:!0,fatherAssigned:!1,available:!1}}}function s(e,t){let r;const a=async()=>{const r=await async function(e){const t=e?.user?.id||"";if(!t||!e?.connection||"function"!=typeof e?.callWS)return{user_id:t,all_views_allowed:!1,default_access_level:"none",view_rules:{}};try{return await e.callWS({type:"domolux/permission/my_views"})}catch(e){return{user_id:t,all_views_allowed:!1,default_access_level:"none",view_rules:{}}}}(e);t(r)};if(e?.connection&&"function"==typeof e.connection.subscribeEvents){const t=e.connection.subscribeEvents(t=>{const r=t?.data?.user_id,s=e?.user?.id;r&&r!==s||a()},"domolux_permissions_updated");t&&"function"==typeof t.then?t.then(e=>{r=e}).catch(()=>{}):"function"==typeof t&&(r=t)}return a(),()=>{r&&r()}}async function n(e){if(!e?.connection||"function"!=typeof e.callWS)return{devices:[],household_devices:[],entities:[],dashboards:[]};try{const t=await e.callWS({type:"domolux/catalog"});return t?.catalog||(t?.devices||t?.dashboards?t:null)||{devices:[],household_devices:[],entities:[],dashboards:[]}}catch(e){return{devices:[],household_devices:[],entities:[],dashboards:[]}}}},1591(e,t,r){r.d(t,{KZ:()=>o,ig:()=>l});r(8111),r(1148),r(7254),r(7036);const a=new Map,s=new Map;function n(e){return"object"==typeof e&&null!==e&&"string"==typeof e.entity_id&&"string"==typeof e.required_access}function i(e){return"object"==typeof e&&null!==e&&"string"==typeof e.card_id&&"string"==typeof e.card_type&&Array.isArray(e.entities)&&e.entities.every(n)}async function o(e,t){if(!e?.connection||"function"!=typeof e.callWS)throw c("unauthorized","No authenticated Home Assistant connection.");if(!t.view_id&&!t.view_path)throw c("invalid_input","Must specify exactly one of 'view_id' or 'view_path'.");if(t.view_id&&t.view_path)throw c("invalid_input","Must specify exactly one of 'view_id' or 'view_path'.");const r={type:"domolux/view/get",...t.view_id?{view_id:t.view_id}:{},...t.view_path?{view_path:t.view_path}:{}},s=await e.callWS(r);if(!s||"object"!=typeof s)throw c("malformed_response","Backend returned malformed view response.");if("object"==typeof(n=s)&&null!==n&&"code"in n&&"message"in n&&"string"==typeof n.code&&"string"==typeof n.message&&("access_denied"===s.code||"view_not_found"===s.code))throw c(s.code,s.message);var n;const o=s.view??s;if("object"!=typeof(l=o)||null===l||"string"!=typeof l.view_id||"string"!=typeof l.view_path||"string"!=typeof l.title||!Array.isArray(l.cards)||!l.cards.every(i))throw c("malformed_response","Backend returned malformed view object.");var l;const d=o;return a.set(d.view_id,d),d}function l(e,t){if(!e?.connection||"function"!=typeof e.connection.subscribeEvents)throw c("unauthorized","No active Home Assistant connection.");let r;const n=e.connection.subscribeEvents(e=>{const r=e?.data;r&&r.action&&r.view_id&&(t.view_id&&r.view_id!==t.view_id||t.view_path&&r.view_path&&r.view_path!==t.view_path||(!function(e,t){if(e&&a.delete(e),t)for(const e of a.keys()){const r=a.get(e);r&&r.view_path===t&&a.delete(e)}s.clear()}(r.view_id,t.view_path),t.onEvent(r)))},"domolux_view_updated");return n&&"function"==typeof n.then?n.then(e=>{r=e}):"function"==typeof n&&(r=n),()=>{r&&r()}}function c(e,t){return{code:e,message:t}}},4682(e,t,r){r.d(t,{dk:()=>i});var a=r(894);const s=()=>r.e("src_dialogs_generic_dialog-box_ts").then(r.bind(r,2092)),n=(e,t,r)=>new Promise(n=>{const i=t.cancel,o=t.confirm;(0,a.r)(e,"show-dialog",{dialogTag:"dialog-box",dialogImport:s,addHistory:t.addHistory,dialogParams:{...t,...r,cancel:()=>{n(!!r?.prompt&&null),i&&i()},confirm:e=>{n(!r?.prompt||e),o&&o(e)}}})}),i=(e,t)=>n(e,t,{confirmation:!0})},6084(e,t,r){r.a(e,async function(e,t){try{var a=r(2501),s=r(6847),n=r(6923),i=r(9867),o=e([a,s,n,i]);[a,s,n,i]=o.then?(await o)():o,t()}catch(e){t(e)}})},2501(e,t,r){r.a(e,async function(e,t){try{r(8111),r(116),r(1701);var a=r(3609),s=r(7983),n=r(8292),i=(r(9939),r(1905)),o=r(6779),l=(r(1633),r(2833)),c=r(4682),d=e([i,o,l]);[i,o,l]=d.then?(await d)():d;const u="M21.1,12.5L22.5,13.91L15.97,20.5L12.5,17L13.9,15.59L15.97,17.67L21.1,12.5M10,17L13,20H3V18C3,15.79 6.58,14 11,14L12.89,14.11L10,17M11,4A4,4 0 0,1 15,8A4,4 0 0,1 11,12A4,4 0 0,1 7,8A4,4 0 0,1 11,4Z",h="M15,14C17.67,14 23,15.33 23,18V20H7V18C7,15.33 12.33,14 15,14M15,12A4,4 0 0,1 11,8A4,4 0 0,1 15,4A4,4 0 0,1 19,8A4,4 0 0,1 15,12M5,9.59L7.12,7.46L8.54,8.88L6.41,11L8.54,13.12L7.12,14.54L5,12.41L2.88,14.54L1.46,13.12L3.59,11L1.46,8.88L2.88,7.46L5,9.59Z",p="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,5A3,3 0 0,1 15,8A3,3 0 0,1 12,11A3,3 0 0,1 9,8A3,3 0 0,1 12,5M17.13,17C15.92,18.85 14.11,20.24 12,20.92C9.89,20.24 8.08,18.85 6.87,17C6.53,16.5 6.24,16 6,15.47C6,13.82 8.71,12.47 12,12.47C15.29,12.47 18,13.79 18,15.47C17.76,16 17.47,16.5 17.13,17Z",f="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z";class v extends s.WF{firstUpdated(){this._loadData()}async _loadData(){if(this._loading=!0,this._error=null,this.hass.user?.is_admin)try{const e=await this.hass.callWS({type:"domolux/role/get"});this._isFatherAssigned=e.father_assigned;const t=await this.hass.callWS({type:"domolux/users/list"});if(this._eligibleUsers=t||[],this._isFatherAssigned){const t=this._eligibleUsers.find(t=>t.id===e.user_id);this._fatherUserName=t?t.name||t.username||t.id:"Household Father / الأب المسؤول"}else this._fatherUserName=null}catch(e){this._error=e?.message||"Failed to load Domolux Roles configuration from backend."}finally{this._loading=!1}else this._loading=!1}_handleUserSelect(e){this._selectedUserId=e.target.value}async _handleAssignClick(){if(!this._selectedUserId)return void(this._error="Please select a user to assign as Father.");const e=this._eligibleUsers.find(e=>e.id===this._selectedUserId),t=e?e.name||e.username:"selected user";if(this._isFatherAssigned){if(!await(0,c.dk)(this,{title:"Replace Father Role / تغيير الأب المسؤول",text:`Are you sure you want to transfer the Father role to ${t}? The existing Father assignment will be revoked.`,confirmText:"Replace / تغيير",dismissText:"Cancel / إلغاء",destructive:!0}))return}await m(this,this._selectedUserId)}_dismissError(){this._error=null}_dismissSuccess(){this._success=null}async _handleRemoveClick(){if(await(0,c.dk)(this,{title:"Remove Father Role / إزالة الأب المسؤول",text:"Are you sure you want to remove the Father role? The household will return to an unassigned status.",confirmText:"Remove / إزالة",dismissText:"Cancel / إلغاء",destructive:!0})){this._submitting=!0,this._error=null,this._success=null;try{await this.hass.callWS({type:"domolux/role/remove_father"}),this._success="Father role removed successfully.",this._selectedUserId="",await this._loadData()}catch(e){this._error=e?.message||"Failed to remove Father role."}finally{this._submitting=!1}}}render(){return this.hass.user?.is_admin?this._loading?s.qy`
        <div class="loading-container">
          <ha-progress-ring active></ha-progress-ring>
          <p>Loading Domolux Roles configuration...</p>
        </div>
      `:s.qy`
      <div class="content" dir="auto">
        <div class="header-section">
          <ha-svg-icon .path=${p} class="header-icon"></ha-svg-icon>
          <div>
            <h1>Domolux Role Management / إدارة أدوار دومولوكس</h1>
            <p class="subtitle">
              Configure the primary Household Father role for access control.
              تعيين الأب المسؤول للمنزل لإدارة الصلاحيات.
            </p>
          </div>
        </div>

        ${this._error?s.qy`<ha-alert alert-type="error" dismissable @alert-dismissed-clicked=${this._dismissError}>
              ${this._error}
            </ha-alert>`:s.s6}
        ${this._success?s.qy`<ha-alert alert-type="success" dismissable @alert-dismissed-clicked=${this._dismissSuccess}>
              ${this._success}
            </ha-alert>`:s.s6}

        <!-- Card 1: Current Status -->
        <ha-card header="Current Father Assignment / الأب الحالي">
          <div class="card-content">
            ${this._isFatherAssigned?s.qy`
                  <div class="status-box active">
                    <ha-svg-icon .path=${u} class="status-icon active"></ha-svg-icon>
                    <div class="status-info">
                      <span class="status-title">${this._fatherUserName}</span>
                      <span class="status-badge">Active Father / الأب المسؤول الحالي</span>
                    </div>
                    <ha-button
                      class="destructive"
                      .disabled=${this._submitting}
                      @click=${this._handleRemoveClick}
                    >
                      <ha-svg-icon .path=${h} slot="start"></ha-svg-icon>
                      Remove Role / إزالة
                    </ha-button>
                  </div>
                `:s.qy`
                  <div class="status-box unassigned">
                    <ha-svg-icon .path=${f} class="status-icon unassigned"></ha-svg-icon>
                    <div class="status-info">
                      <span class="status-title">No Father Assigned / لم يتم تعيين أب مسؤول</span>
                      <span class="status-subtitle">Select an eligible user below to assign the role.</span>
                    </div>
                  </div>
                `}
          </div>
        </ha-card>

        <!-- Card 2: Assign / Replace -->
        <ha-card header=${this._isFatherAssigned?"Replace Father Role / تغيير الأب":"Assign Father Role / تعيين الأب"}>
          <div class="card-content">
            ${0===this._eligibleUsers.length?s.qy`
                  <p class="empty-state">
                    No eligible non-administrator users available for Father assignment. Create a regular Home Assistant user first.
                  </p>
                `:s.qy`
                  <div class="form-row">
                    <label for="user-select" class="form-label">
                      Select Household Member / اختر فرد من العائلة:
                    </label>
                    <select
                      id="user-select"
                      class="user-select-dropdown"
                      .value=${this._selectedUserId}
                      @change=${this._handleUserSelect}
                      .disabled=${this._submitting}
                    >
                      <option value="">-- Choose User / اختر مستخدم --</option>
                      ${this._eligibleUsers.map(e=>s.qy`
                          <option value=${e.id}>
                            ${e.name}${e.username?` (@${e.username})`:""}
                          </option>
                        `)}
                    </select>

                    <ha-button
                      raised
                      .disabled=${!this._selectedUserId||this._submitting}
                      @click=${this._handleAssignClick}
                    >
                      ${this._isFatherAssigned?"Replace Father / تغيير الأب":"Assign Role / تعيين"}
                    </ha-button>
                  </div>
                `}
          </div>
        </ha-card>
      </div>
    `:s.qy`
        <div class="content" dir="auto">
          <ha-alert alert-type="warning" title="Access Denied / غير مصرح">
            Administrator privileges are required to view or configure Domolux Application Roles.
            يلزم وجود صلاحيات مسؤول لإدارة أدوار دومولوكس.
          </ha-alert>
        </div>
      `}constructor(...e){super(...e),this._loading=!0,this._submitting=!1,this._error=null,this._success=null,this._isFatherAssigned=!1,this._fatherUserName=null,this._eligibleUsers=[],this._selectedUserId=""}}async function m(e,t){e._submitting=!0,e._error=null,e._success=null;try{await e.hass.callWS({type:"domolux/role/set_father",user_id:t}),e._success="Father role assigned successfully.",e._selectedUserId="",await e._loadData()}catch(t){e._error=t?.message||"Failed to assign Father role."}finally{e._submitting=!1}}v.styles=s.AH`
      :host {
        display: block;
        padding: var(--ha-space-4, 16px);
        background-color: var(--primary-background-color);
        color: var(--primary-text-color);
      }

      .content {
        max-width: 800px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-4, 16px);
      }

      .header-section {
        display: flex;
        align-items: center;
        gap: var(--ha-space-4, 16px);
        margin-bottom: var(--ha-space-2, 8px);
      }

      .header-icon {
        width: 48px;
        height: 48px;
        color: var(--primary-color);
      }

      h1 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 500;
      }

      .subtitle {
        margin: var(--ha-space-1, 4px) 0 0 0;
        color: var(--secondary-text-color);
        font-size: 0.9rem;
      }

      ha-card {
        border-radius: var(--ha-card-border-radius, 12px);
      }

      .card-content {
        padding: var(--ha-space-4, 16px);
      }

      .status-box {
        display: flex;
        align-items: center;
        padding: var(--ha-space-4, 16px);
        border-radius: 8px;
        gap: var(--ha-space-4, 16px);
      }

      .status-box.active {
        background-color: var(--state-active-color, rgba(3, 169, 244, 0.1));
        border: 1px solid var(--primary-color);
      }

      .status-box.unassigned {
        background-color: var(--warning-color-subtle, rgba(255, 152, 0, 0.1));
        border: 1px solid var(--warning-color, #ff9800);
      }

      .status-icon {
        width: 36px;
        height: 36px;
      }

      .status-icon.active {
        color: var(--primary-color);
      }

      .status-icon.unassigned {
        color: var(--warning-color, #ff9800);
      }

      .status-info {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .status-title {
        font-size: 1.1rem;
        font-weight: 600;
      }

      .status-badge {
        font-size: 0.85rem;
        color: var(--primary-color);
        font-weight: 500;
      }

      .status-subtitle {
        font-size: 0.85rem;
        color: var(--secondary-text-color);
      }

      .form-row {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-3, 12px);
      }

      .form-label {
        font-weight: 500;
        font-size: 0.95rem;
      }

      .user-select-dropdown {
        width: 100%;
        padding: 12px;
        border-radius: 8px;
        border: 1px solid var(--divider-color, #ccc);
        background-color: var(--card-background-color, #fff);
        color: var(--primary-text-color, #000);
        font-size: 1rem;
      }

      .user-select-dropdown:focus {
        outline: none;
        border-color: var(--primary-color);
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        gap: 16px;
      }

      ha-button.destructive {
        --mdc-theme-primary: var(--error-color, #db4437);
        color: var(--error-color, #db4437);
      }

      .empty-state {
        color: var(--secondary-text-color);
        font-style: italic;
        margin: 0;
      }
    `,(0,a.Cg)([(0,n.MZ)({attribute:!1})],v.prototype,"hass",void 0),(0,a.Cg)([(0,n.wk)()],v.prototype,"_loading",void 0),(0,a.Cg)([(0,n.wk)()],v.prototype,"_submitting",void 0),(0,a.Cg)([(0,n.wk)()],v.prototype,"_error",void 0),(0,a.Cg)([(0,n.wk)()],v.prototype,"_success",void 0),(0,a.Cg)([(0,n.wk)()],v.prototype,"_isFatherAssigned",void 0),(0,a.Cg)([(0,n.wk)()],v.prototype,"_fatherUserName",void 0),(0,a.Cg)([(0,n.wk)()],v.prototype,"_eligibleUsers",void 0),(0,a.Cg)([(0,n.wk)()],v.prototype,"_selectedUserId",void 0),v=(0,a.Cg)([(0,n.EM)("ha-config-domolux-roles")],v),t()}catch(g){t(g)}})},6847(e,t,r){r.a(e,async function(e,t){try{r(4423),r(8111),r(1148),r(2489),r(116),r(1701),r(3579),r(7642),r(5024),r(1698);var a=r(3609),s=r(7983),n=r(8292),i=(r(9939),r(1905)),o=r(6779),l=(r(1633),r(2833)),c=r(7879),d=e([i,o,l]);[i,o,l]=d.then?(await d)():d;const u="M12,5.5A3.5,3.5 0 0,1 15.5,9A3.5,3.5 0 0,1 12,12.5A3.5,3.5 0 0,1 8.5,9A3.5,3.5 0 0,1 12,5.5M5,8C5.56,8 6.08,8.15 6.53,8.42C6.38,9.85 6.8,11.27 7.66,12.38C7.16,13.34 6.16,14 5,14A3,3 0 0,1 2,11A3,3 0 0,1 5,8M19,8A3,3 0 0,1 22,11A3,3 0 0,1 19,14C17.84,14 16.84,13.34 16.34,12.38C17.2,11.27 17.62,9.85 17.47,8.42C17.92,8.15 18.44,8 19,8M5.5,18.25C5.5,16.18 8.41,14.5 12,14.5C15.59,14.5 18.5,16.18 18.5,18.25V20H5.5V18.25M0,20V18.5C0,17.11 1.89,15.94 4.45,15.6C3.86,16.28 3.5,17.22 3.5,18.25V20H0M24,20H20.5V18.25C20.5,17.22 20.14,16.28 19.55,15.6C22.11,15.94 24,17.11 24,18.5V20Z",h="M15,14C12.33,14 7,15.33 7,18V20H23V18C23,15.33 17.67,14 15,14M6,10V7H4V10H1V12H4V15H6V12H9V10M15,12A4,4 0 0,0 19,8A4,4 0 0,0 15,4A4,4 0 0,0 11,8A4,4 0 0,0 15,12Z",p="M6 8C6 5.79 7.79 4 10 4S14 5.79 14 8 12.21 12 10 12 6 10.21 6 8M12 18.2C12 17.24 12.5 16.34 13.2 15.74V15.5C13.2 15.11 13.27 14.74 13.38 14.38C12.35 14.14 11.21 14 10 14C5.58 14 2 15.79 2 18V20H12V18.2M22 18.3V21.8C22 22.4 21.4 23 20.7 23H15.2C14.6 23 14 22.4 14 21.7V18.2C14 17.6 14.6 17 15.2 17V15.5C15.2 14.1 16.6 13 18 13C19.4 13 20.8 14.1 20.8 15.5V17C21.4 17 22 17.6 22 18.3M19.5 15.5C19.5 14.7 18.8 14.2 18 14.2C17.2 14.2 16.5 14.7 16.5 15.5V17H19.5V15.5Z",f="M21.1,12.5L22.5,13.91L15.97,20.5L12.5,17L13.9,15.59L15.97,17.67L21.1,12.5M10,17L13,20H3V18C3,15.79 6.58,14 11,14L12.89,14.11L10,17M11,4A4,4 0 0,1 15,8A4,4 0 0,1 11,12A4,4 0 0,1 7,8A4,4 0 0,1 11,4Z",v="M22,18V22H18V19H15V16H12L9.74,13.74C9.19,13.91 8.61,14 8,14A6,6 0 0,1 2,8A6,6 0 0,1 8,2A6,6 0 0,1 14,8C14,8.61 13.91,9.19 13.74,9.74L22,18M7,5A2,2 0 0,0 5,7A2,2 0 0,0 7,9A2,2 0 0,0 9,7A2,2 0 0,0 7,5Z",m="M15,14C17.67,14 23,15.33 23,18V20H7V18C7,15.33 12.33,14 15,14M15,12A4,4 0 0,1 11,8A4,4 0 0,1 15,4A4,4 0 0,1 19,8A4,4 0 0,1 15,12M5,9.59L7.12,7.46L8.54,8.88L6.41,11L8.54,13.12L7.12,14.54L5,12.41L2.88,14.54L1.46,13.12L3.59,11L1.46,8.88L2.88,7.46L5,9.59Z",g="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5M11,7H13V13H11M11,15H13V17H11",_="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z",y="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z",b="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,5A3,3 0 0,1 15,8A3,3 0 0,1 12,11A3,3 0 0,1 9,8A3,3 0 0,1 12,5M17.13,17C15.92,18.85 14.11,20.24 12,20.92C9.89,20.24 8.08,18.85 6.87,17C6.53,16.5 6.24,16 6,15.47C6,13.82 8.71,12.47 12,12.47C15.29,12.47 18,13.79 18,15.47C17.76,16 17.47,16.5 17.13,17Z",w="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z",C="M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z",x="M13,3V9H21V3M13,21H21V11H13M3,21H11V15H3M3,13H11V3H3V13Z",k="M3 6H21V4H3C1.9 4 1 4.9 1 6V18C1 19.1 1.9 20 3 20H7V18H3V6M13 12H9V13.78C8.39 14.33 8 15.11 8 16C8 16.89 8.39 17.67 9 18.22V20H13V18.22C13.61 17.67 14 16.88 14 16S13.61 14.33 13 13.78V12M11 17.5C10.17 17.5 9.5 16.83 9.5 16S10.17 14.5 11 14.5 12.5 15.17 12.5 16 11.83 17.5 11 17.5M22 8H16C15.5 8 15 8.5 15 9V19C15 19.5 15.5 20 16 20H22C22.5 20 23 19.5 23 19V9C23 8.5 22.5 8 22 8M21 18H17V10H21V18Z",L="M3,17V19H9V17H3M3,5V7H13V5H3M13,21V19H21V17H13V15H11V21H13M7,9V11H3V13H7V15H9V9H7M21,13V11H11V13H21M15,9H17V7H21V5H17V3H15V9Z",A="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z",M="M12,18.54L19.37,12.8L21,14.07L12,21.07L3,14.07L4.62,12.81L12,18.54M12,16L3,9L12,2L21,9L12,16M12,4.53L6.26,9L12,13.47L17.74,9L12,4.53Z",S="M3 4H21V8H19V20H17V8H7V20H5V8H3V4M8 9H16V11H8V9M8 12H16V14H8V12M8 15H16V17H8V15M8 18H16V20H8V18Z",E="M12,2A7,7 0 0,0 5,9C5,11.38 6.19,13.47 8,14.74V17A1,1 0 0,0 9,18H15A1,1 0 0,0 16,17V14.74C17.81,13.47 19,11.38 19,9A7,7 0 0,0 12,2M9,21A1,1 0 0,0 10,22H14A1,1 0 0,0 15,21V20H9V21Z",$="M17,7H7A5,5 0 0,0 2,12A5,5 0 0,0 7,17H17A5,5 0 0,0 22,12A5,5 0 0,0 17,7M17,15A3,3 0 0,1 14,12A3,3 0 0,1 17,9A3,3 0 0,1 20,12A3,3 0 0,1 17,15Z",P="M16.95,16.95L14.83,14.83C15.55,14.1 16,13.1 16,12C16,11.26 15.79,10.57 15.43,10L17.6,7.81C18.5,9 19,10.43 19,12C19,13.93 18.22,15.68 16.95,16.95M12,5C13.57,5 15,5.5 16.19,6.4L14,8.56C13.43,8.21 12.74,8 12,8A4,4 0 0,0 8,12C8,13.1 8.45,14.1 9.17,14.83L7.05,16.95C5.78,15.68 5,13.93 5,12A7,7 0 0,1 12,5M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12C22,6.47 17.5,2 12,2Z",I="M12,11A1,1 0 0,0 11,12A1,1 0 0,0 12,13A1,1 0 0,0 13,12A1,1 0 0,0 12,11M12.5,2C17,2 17.11,5.57 14.75,6.75C13.76,7.24 13.32,8.29 13.13,9.22C13.61,9.42 14.03,9.73 14.35,10.13C18.05,8.13 22.03,8.92 22.03,12.5C22.03,17 18.46,17.1 17.28,14.73C16.78,13.74 15.72,13.3 14.79,13.11C14.59,13.59 14.28,14 13.88,14.34C15.87,18.03 15.08,22 11.5,22C7,22 6.91,18.42 9.27,17.24C10.25,16.75 10.69,15.71 10.89,14.79C10.4,14.59 9.97,14.27 9.65,13.87C5.96,15.85 2,15.07 2,11.5C2,7 5.56,6.89 6.74,9.26C7.24,10.25 8.29,10.68 9.22,10.87C9.41,10.39 9.73,9.97 10.14,9.65C8.15,5.96 8.94,2 12.5,2Z",T="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z",D="M1,10V12A9,9 0 0,1 10,21H12C12,14.92 7.07,10 1,10M1,14V16A5,5 0 0,1 6,21H8A7,7 0 0,0 1,14M1,18V21H4A3,3 0 0,0 1,18M21,3H3C1.89,3 1,3.89 1,5V8H3V5H21V19H14V21H21A2,2 0 0,0 23,19V5C23,3.89 22.1,3 21,3Z",z="M12,2C14.65,2 17.19,3.06 19.07,4.93L17.65,6.35C16.15,4.85 14.12,4 12,4C9.88,4 7.84,4.84 6.35,6.35L4.93,4.93C6.81,3.06 9.35,2 12,2M3.66,6.5L5.11,7.94C4.39,9.17 4,10.57 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12C20,10.57 19.61,9.17 18.88,7.94L20.34,6.5C21.42,8.12 22,10.04 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12C2,10.04 2.58,8.12 3.66,6.5M12,6A6,6 0 0,1 18,12C18,13.59 17.37,15.12 16.24,16.24L14.83,14.83C14.08,15.58 13.06,16 12,16C10.94,16 9.92,15.58 9.17,14.83L7.76,16.24C6.63,15.12 6,13.59 6,12A6,6 0 0,1 12,6M12,8A1,1 0 0,0 11,9A1,1 0 0,0 12,10A1,1 0 0,0 13,9A1,1 0 0,0 12,8Z";class N extends s.WF{firstUpdated(){this._checkRoleAndLoadFamily()}async _checkRoleAndLoadFamily(){this._loading=!0,this._error=null;try{const e=await(0,c.jw)(this.hass);if(this._isFather=e.isFather,!this._isFather)return void(this._loading=!1);await this._loadFamilyMembers()}catch(e){this._error=this._parseErrorMessage(e,"Failed to initialize Family Manager.")}finally{this._loading=!1}}async _loadFamilyMembers(){try{const e=await this.hass.callWS({type:"domolux/family/list"});this._familyMembers=e||[]}catch(e){this._error=this._parseErrorMessage(e,"Failed to load family members.")}}_parseErrorMessage(e,t){if(!e)return t;const r=e.code||e.error?.code||"",a=e.message||e.error?.message||"";switch(r){case"father_required":return"Privilege error: Father role required to perform family management actions.";case"invalid_input":return a||"Invalid input provided. Password must be at least 8 characters.";case"duplicate_username":return a||"Username already exists in Home Assistant.";case"family_user_not_found":return"Target user is not a Domolux managed family member.";case"cannot_target_admin":return"Security policy violation: Cannot target Administrator account.";case"cannot_target_owner":return"Security policy violation: Cannot target Owner account.";case"cannot_target_father":return"Security policy violation: Cannot target Father account.";case"family_user_orphaned":return"Target family member is missing from Home Assistant authentication system.";default:return a||t}}_dismissError(){this._error=null}_dismissSuccess(){this._success=null}_openCreateDialog(){this._createDisplayName="",this._createUsername="",this._createPassword="",this._error=null,this._showCreateDialog=!0}_closeCreateDialog(){this._showCreateDialog=!1,this._createPassword=""}async _handleCreateMember(){if(!this._createDisplayName.trim())return void(this._error="Display Name is required.");if(!this._createUsername.trim())return void(this._error="Username is required.");if(!this._createPassword||this._createPassword.length<8)return void(this._error="Password must be at least 8 characters long.");this._submitting=!0,this._error=null,this._success=null;const e=this._createDisplayName.trim(),t=this._createUsername.trim(),r=this._createPassword;this._createPassword="";try{await this.hass.callWS({type:"domolux/family/create",display_name:e,username:t,password:r}),this._success=`Family member '${e}' (@${t}) created successfully.`,this._closeCreateDialog(),await this._loadFamilyMembers()}catch(e){this._error=this._parseErrorMessage(e,"Failed to create family member.")}finally{this._submitting=!1}}async _handleToggleStatus(e){const t="ACTIVE"===e.status,r=t?"domolux/family/disable":"domolux/family/enable",a=t?"Disable / تعليق":"Enable / تفعيل";this._submitting=!0,this._error=null,this._success=null;try{await this.hass.callWS({type:r,user_id:e.user_id}),this._success=`Family member '${e.display_name}' ${t?"disabled":"enabled"} successfully.`,await this._loadFamilyMembers()}catch(e){this._error=this._parseErrorMessage(e,`Failed to ${a.toLowerCase()} family member.`)}finally{this._submitting=!1}}_openPasswordDialog(e){this._selectedUserForPassword=e,this._newPassword="",this._error=null,this._showPasswordDialog=!0}_closePasswordDialog(){this._showPasswordDialog=!1,this._selectedUserForPassword=null,this._newPassword=""}async _handleChangePassword(){if(!this._selectedUserForPassword)return;if(!this._newPassword||this._newPassword.length<8)return void(this._error="New password must be at least 8 characters long.");this._submitting=!0,this._error=null,this._success=null;const e=this._selectedUserForPassword,t=this._newPassword;this._newPassword="";try{await this.hass.callWS({type:"domolux/family/change_password",user_id:e.user_id,new_password:t}),this._success=`Password changed successfully for '${e.display_name}'.`,this._closePasswordDialog()}catch(e){this._error=this._parseErrorMessage(e,"Failed to change password.")}finally{this._submitting=!1}}_openDeleteDialog(e){this._selectedUserForDelete=e,this._error=null,this._showDeleteDialog=!0}_closeDeleteDialog(){this._showDeleteDialog=!1,this._selectedUserForDelete=null}async _handleConfirmDeleteMember(){if(!this._selectedUserForDelete)return;const e=this._selectedUserForDelete;this._submitting=!0,this._error=null,this._success=null;try{await this.hass.callWS({type:"domolux/family/delete",user_id:e.user_id}),this._success=`Family member '${e.display_name}' deleted successfully.`,this._closeDeleteDialog(),await this._loadFamilyMembers()}catch(e){this._error=this._parseErrorMessage(e,"Failed to delete family member.")}finally{this._submitting=!1}}async _openPermissionDialog(e){this._isFather&&(this._selectedUserForPermissions=e,this._userPermissionSet=null,this._evalResult=null,this._newDefaultAccessLevel="none",this._newRuleTargetType="entity",this._newRuleTargetId="",this._newRuleAccessLevel="none",this._newViewPath="",this._newViewEffect="deny",this._evalTargetType="entity",this._evalTargetId="",this._activePermissionTab="devices",this._deviceSearchQuery="",this._deviceRoomFilter="all",this._expandedDeviceIds=new Set,this._expandedDashboardIds=new Set,this._selectedDashboardId="all",this._dashboardSearchQuery="",this._error=null,this._showPermissionDialog=!0,await Promise.all([this._loadUserPermissions(e.user_id),this._loadCatalog()]))}_closePermissionDialog(){this._showPermissionDialog=!1,this._selectedUserForPermissions=null,this._userPermissionSet=null,this._evalResult=null,this._catalogDevices=[],this._catalogDashboards=[],this._selectedDashboardId="all",this._dashboardSearchQuery=""}async _loadCatalog(){this._catalogLoading=!0;try{const e=await(0,c.Nr)(this.hass);this._catalogDevices=e?.devices||e?.household_devices||[],this._catalogDashboards=e?.dashboards||[]}catch(e){this._catalogDevices=[],this._catalogDashboards=[]}finally{this._catalogLoading=!1}}_getDomainIconPath(e){switch(e){case"cover":return S;case"light":return E;case"switch":return $;case"climate":return P;case"fan":return I;case"lock":return T;case"media_player":return D;case"vacuum":return z;default:return k}}_getAvailableRooms(){const e=new Set;for(const t of this._catalogDevices)t.area_name&&e.add(t.area_name);return Array.from(e).sort()}_getFilteredDevices(){return this._catalogDevices.filter(e=>{if("all"!==this._deviceRoomFilter&&e.area_name!==this._deviceRoomFilter)return!1;if(this._deviceSearchQuery.trim()){const t=this._deviceSearchQuery.toLowerCase(),r=e.name.toLowerCase().includes(t),a=(e.area_name||"").toLowerCase().includes(t),s=e.channels?.some(e=>e.name.toLowerCase().includes(t));if(!r&&!a&&!s)return!1}return!0})}_getFilteredDashboards(){let e=this._catalogDashboards;if("all"!==this._selectedDashboardId&&(e=e.filter(e=>e.dashboard_id===this._selectedDashboardId)),this._dashboardSearchQuery.trim()){const t=this._dashboardSearchQuery.toLowerCase();e=e.map(e=>{const r=e.title.toLowerCase().includes(t)||e.dashboard_id.toLowerCase().includes(t),a=e.views.filter(e=>e.title.toLowerCase().includes(t)||e.view_path.toLowerCase().includes(t)||e.entities.some(e=>e.toLowerCase().includes(t)));return r?e:a.length>0?{...e,views:a}:null}).filter(e=>null!==e)}return e}_getEffectiveDeviceLevel(e){if(!this._userPermissionSet)return"none";const t=Object.values(this._userPermissionSet.entity_rules||{}),r=t.find(t=>t.target_type===e.target_type&&t.target_id===e.target_id||"device"===t.target_type&&t.target_id===e.device_id);if(r)return r.access_level;if(!e.is_multi_entity&&e.primary_entity_id){const r=t.find(t=>"entity"===t.target_type&&t.target_id===e.primary_entity_id);if(r)return r.access_level}if(e.is_multi_entity&&e.channels&&e.channels.length>0){const t=e.channels.map(e=>this._getEffectiveChannelLevel(e.entity_id));if(t.every(e=>"control"===e))return"control";if(t.every(e=>"read"===e))return"read"}return this._userPermissionSet.default_access_level||"none"}_getEffectiveChannelLevel(e){if(!this._userPermissionSet)return"none";const t=Object.values(this._userPermissionSet.entity_rules||{}).find(t=>"entity"===t.target_type&&t.target_id===e);return t?t.access_level:this._userPermissionSet.default_access_level||"none"}async _handleSetDevicePermission(e,t){if(this._selectedUserForPermissions){this._submitting=!0,this._error=null;try{const r=await this.hass.callWS({type:"domolux/permission/set_entity_rule",user_id:this._selectedUserForPermissions.user_id,target_type:e.target_type,target_id:e.target_id,access_level:t});r?.permissions&&(this._userPermissionSet=r.permissions),this._success="Device permission updated successfully."}catch(e){this._error=this._parseErrorMessage(e,"Failed to update device permission.")}finally{this._submitting=!1}}}async _handleSetChannelPermission(e,t){if(this._selectedUserForPermissions){this._submitting=!0,this._error=null;try{const r=await this.hass.callWS({type:"domolux/permission/set_entity_rule",user_id:this._selectedUserForPermissions.user_id,target_type:"entity",target_id:e.entity_id,access_level:t});r?.permissions&&(this._userPermissionSet=r.permissions),this._success="Channel permission updated successfully."}catch(e){this._error=this._parseErrorMessage(e,"Failed to update channel permission.")}finally{this._submitting=!1}}}async _handleSelectAllChannels(e,t){if(this._selectedUserForPermissions&&e.channels){this._submitting=!0,this._error=null;try{for(const r of e.channels){const e=await this.hass.callWS({type:"domolux/permission/set_entity_rule",user_id:this._selectedUserForPermissions.user_id,target_type:"entity",target_id:r.entity_id,access_level:t});e?.permissions&&(this._userPermissionSet=e.permissions)}this._success=`All channels updated to ${t}.`}catch(e){this._error=this._parseErrorMessage(e,"Failed to update all channels.")}finally{this._submitting=!1}}}async _handleSetViewRuleDirect(e,t){if(this._selectedUserForPermissions){this._submitting=!0,this._error=null;try{const r="none"===t?"deny":"allow",a=await this.hass.callWS({type:"domolux/permission/set_view_rule",user_id:this._selectedUserForPermissions.user_id,view_path:e,effect:r,access_level:t});a?.permissions&&(this._userPermissionSet=a.permissions),this._success="View permission updated successfully."}catch(e){this._error=this._parseErrorMessage(e,"Failed to update view permission.")}finally{this._submitting=!1}}}_getExplicitEntityOverrideLevel(e){if(!this._userPermissionSet)return null;const t=Object.values(this._userPermissionSet.entity_rules||{}).find(t=>"entity"===t.target_type&&t.target_id===e);return t?t.access_level:null}async _handleSetEntityOverride(e,t){if(this._selectedUserForPermissions){this._submitting=!0,this._error=null;try{if("inherited"===t){const t=Object.values(this._userPermissionSet?.entity_rules||{}).find(t=>"entity"===t.target_type&&t.target_id===e);return void(t&&await this._handleRemoveEntityRule(t.rule_id))}const r=await this.hass.callWS({type:"domolux/permission/set_entity_rule",user_id:this._selectedUserForPermissions.user_id,target_type:"entity",target_id:e,access_level:t});r?.permissions&&(this._userPermissionSet=r.permissions),this._success="Device exception updated successfully."}catch(e){this._error=this._parseErrorMessage(e,"Failed to update exception.")}finally{this._submitting=!1}}}_lookupDeviceOrEntityName(e){for(const t of this._catalogDevices){if(t.primary_entity_id===e)return t.name;if(t.channels){const r=t.channels.find(t=>t.entity_id===e);if(r)return`${t.name} - ${r.name}`}}return this.hass?.states?.[e]?.attributes?.friendly_name||e}_toggleExpandDevice(e){const t=new Set(this._expandedDeviceIds);t.has(e)?t.delete(e):t.add(e),this._expandedDeviceIds=t}_toggleExpandDashboard(e){const t=new Set(this._expandedDashboardIds);t.has(e)?t.delete(e):t.add(e),this._expandedDashboardIds=t}async _loadUserPermissions(e){try{const t=await this.hass.callWS({type:"domolux/permission/get",user_id:e});this._userPermissionSet=t}catch(e){this._error=this._parseErrorMessage(e,"Failed to load user permissions.")}}async _handleSetDefaultAccessLevel(e){if(!this._selectedUserForPermissions)return;const t=e||this._newDefaultAccessLevel;if(t){this._submitting=!0,this._error=null;try{const e=await this.hass.callWS({type:"domolux/permission/set_default_level",user_id:this._selectedUserForPermissions.user_id,default_access_level:t});e?.permissions&&(this._userPermissionSet=e.permissions),this._success="Default access level updated successfully."}catch(e){this._error=this._parseErrorMessage(e,"Failed to update default access level.")}finally{this._submitting=!1}}else this._error="Default access level is required."}async _handleAddEntityRule(){if(this._selectedUserForPermissions)if(this._newRuleTargetId.trim()){this._submitting=!0,this._error=null;try{const e=await this.hass.callWS({type:"domolux/permission/set_entity_rule",user_id:this._selectedUserForPermissions.user_id,target_type:this._newRuleTargetType,target_id:this._newRuleTargetId.trim(),access_level:this._newRuleAccessLevel});e?.permissions&&(this._userPermissionSet=e.permissions),this._newRuleTargetId="",this._success="Entity permission rule added successfully."}catch(e){this._error=this._parseErrorMessage(e,"Failed to add entity permission rule.")}finally{this._submitting=!1}}else this._error="Target ID is required for entity permission rule."}async _handleRemoveEntityRule(e){if(this._selectedUserForPermissions){this._submitting=!0,this._error=null;try{const t=await this.hass.callWS({type:"domolux/permission/remove_entity_rule",user_id:this._selectedUserForPermissions.user_id,rule_id:e});t?.permissions&&(this._userPermissionSet=t.permissions),this._success="Entity permission rule removed successfully."}catch(e){this._error=this._parseErrorMessage(e,"Failed to remove entity permission rule.")}finally{this._submitting=!1}}}async _handleAddViewRule(){if(this._selectedUserForPermissions)if(this._newViewPath.trim()){this._submitting=!0,this._error=null;try{const e=await this.hass.callWS({type:"domolux/permission/set_view_rule",user_id:this._selectedUserForPermissions.user_id,view_path:this._newViewPath.trim(),effect:this._newViewEffect});e?.permissions&&(this._userPermissionSet=e.permissions),this._newViewPath="",this._success="View permission rule added successfully."}catch(e){this._error=this._parseErrorMessage(e,"Failed to add view permission rule.")}finally{this._submitting=!1}}else this._error="View Path is required for view permission rule."}async _handleRemoveViewRule(e){if(this._selectedUserForPermissions){this._submitting=!0,this._error=null;try{const t=await this.hass.callWS({type:"domolux/permission/remove_view_rule",user_id:this._selectedUserForPermissions.user_id,view_path:e});t?.permissions&&(this._userPermissionSet=t.permissions),this._success="View permission rule removed successfully."}catch(e){this._error=this._parseErrorMessage(e,"Failed to remove view permission rule.")}finally{this._submitting=!1}}}async _handleResetPermissions(){if(this._selectedUserForPermissions){this._submitting=!0,this._error=null;try{const e=await this.hass.callWS({type:"domolux/permission/reset",user_id:this._selectedUserForPermissions.user_id});e?.permissions&&(this._userPermissionSet=e.permissions),this._evalResult=null,this._success="User permissions reset to default successfully."}catch(e){this._error=this._parseErrorMessage(e,"Failed to reset permissions.")}finally{this._submitting=!1}}}async _handleEvaluatePermission(){if(this._selectedUserForPermissions)if(this._evalTargetId.trim()){this._submitting=!0,this._error=null;try{const e=await this.hass.callWS({type:"domolux/permission/evaluate",user_id:this._selectedUserForPermissions.user_id,target_type:this._evalTargetType,target_id:this._evalTargetId.trim()});this._evalResult=e}catch(e){this._error=this._parseErrorMessage(e,"Failed to evaluate permission.")}finally{this._submitting=!1}}else this._error="Target ID or View Path is required for evaluation."}_handleCreateDisplayNameInput(e){this._createDisplayName=e.target.value}_handleCreateUsernameInput(e){this._createUsername=e.target.value}_handleCreatePasswordInput(e){this._createPassword=e.target.value}_handleNewPasswordInput(e){this._newPassword=e.target.value}render(){return this._loading?s.qy`
        <div class="loading-container">
          <ha-progress-ring active></ha-progress-ring>
          <p>Loading Domolux Family Manager...</p>
        </div>
      `:this._isFather?s.qy`
      <div class="content" dir="auto">
        <!-- Header -->
        <div class="header-section">
          <ha-svg-icon
            .path=${u}
            class="header-icon"
          ></ha-svg-icon>
          <div class="header-text">
            <h1>Domolux Family Manager / إدارة عائلة دومولوكس</h1>
            <p class="subtitle">
              Manage family member accounts, security statuses, and access
              credentials. إدارة حسابات أفراد العائلة وحالات الأمان وكلمات
              المرور.
            </p>
          </div>
          <div class="header-actions">
            <ha-button
              raised
              .disabled=${this._submitting}
              @click=${this._openCreateDialog}
            >
              <ha-svg-icon .path=${h} slot="start"></ha-svg-icon>
              Add Member / إضافة فرد
            </ha-button>
            <ha-button
              .disabled=${this._submitting}
              @click=${this._loadFamilyMembers}
              title="Refresh / تحديث"
            >
              <ha-svg-icon .path=${_} slot="start"></ha-svg-icon>
              Refresh / تحديث
            </ha-button>
          </div>
        </div>

        <!-- System Alerts -->
        ${this._error?s.qy`<ha-alert
              alert-type="error"
              dismissable
              .localize=${this.hass?.localize}
              @alert-dismissed-clicked=${this._dismissError}
            >
              ${this._error}
            </ha-alert>`:s.s6}
        ${this._success?s.qy`<ha-alert
              alert-type="success"
              dismissable
              .localize=${this.hass?.localize}
              @alert-dismissed-clicked=${this._dismissSuccess}
            >
              ${this._success}
            </ha-alert>`:s.s6}

        <!-- Family Dashboard Table Card -->
        <ha-card header="Managed Family Members / أفراد العائلة المدارون">
          <div class="card-content">
            ${0===this._familyMembers.length?s.qy`
                  <div class="empty-state">
                    <p>
                      No managed family members found. Click "Add Member" above
                      to create a family user.
                    </p>
                  </div>
                `:s.qy`
                  <div class="table-container">
                    <table class="member-table">
                      <thead>
                        <tr>
                          <th>Member Name / الاسم</th>
                          <th>Username / اسم المستخدم</th>
                          <th>Status / الحالة</th>
                          <th>Managed ID / المعرف</th>
                          <th>Actions / الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${this._familyMembers.map(e=>{const t="ACTIVE"===e.status;return s.qy`
                            <tr>
                              <td class="name-cell">
                                <span class="display-name"
                                  >${e.display_name}</span
                                >
                              </td>
                              <td class="username-cell">@${e.username}</td>
                              <td class="status-cell">
                                <span
                                  class="status-badge ${t?"active":"disabled"}"
                                >
                                  <ha-svg-icon
                                    .path=${t?f:p}
                                  ></ha-svg-icon>
                                  ${t?"Active / نشط":"Suspended / معلق"}
                                </span>
                              </td>
                              <td class="id-cell">
                                <code>${e.user_id}</code>
                              </td>
                              <td class="actions-cell">
                                <ha-button
                                  size="small"
                                  .disabled=${this._submitting}
                                  @click=${()=>this._handleToggleStatus(e)}
                                >
                                  <ha-svg-icon
                                    .path=${t?p:f}
                                    slot="start"
                                  ></ha-svg-icon>
                                  ${t?"Disable / تعليق":"Enable / تفعيل"}
                                </ha-button>
                                <ha-button
                                  size="small"
                                  .disabled=${this._submitting}
                                  @click=${()=>this._openPasswordDialog(e)}
                                >
                                  <ha-svg-icon
                                    .path=${v}
                                    slot="start"
                                  ></ha-svg-icon>
                                  Password / كلمة السر
                                </ha-button>
                                <ha-button
                                  size="small"
                                  .disabled=${this._submitting}
                                  @click=${()=>this._openPermissionDialog(e)}
                                >
                                  <ha-svg-icon
                                    .path=${b}
                                    slot="start"
                                  ></ha-svg-icon>
                                  Permissions / الصلاحيات
                                </ha-button>
                                <ha-button
                                  size="small"
                                  class="destructive"
                                  .disabled=${this._submitting}
                                  @click=${()=>this._openDeleteDialog(e)}
                                >
                                  <ha-svg-icon
                                    .path=${m}
                                    slot="start"
                                  ></ha-svg-icon>
                                  Delete / حذف
                                </ha-button>
                              </td>
                            </tr>
                          `})}
                      </tbody>
                    </table>
                  </div>
                `}
          </div>
        </ha-card>

        <!-- Create Member Dialog -->
        ${this._showCreateDialog?s.qy`
              <div class="dialog-backdrop">
                <div class="dialog-box">
                  <div class="dialog-header">
                    <h2>Add Family Member / إضافة فرد من العائلة</h2>
                    <button
                      class="icon-button"
                      @click=${this._closeCreateDialog}
                    >
                      <ha-svg-icon .path=${y}></ha-svg-icon>
                    </button>
                  </div>
                  <div class="dialog-body">
                    <div class="form-group">
                      <label for="create-name"
                        >Display Name / الاسم المعروض</label
                      >
                      <input
                        id="create-name"
                        type="text"
                        placeholder="e.g. Child One"
                        .value=${this._createDisplayName}
                        @input=${this._handleCreateDisplayNameInput}
                      />
                    </div>
                    <div class="form-group">
                      <label for="create-username"
                        >Username / اسم المستخدم</label
                      >
                      <input
                        id="create-username"
                        type="text"
                        placeholder="e.g. child1"
                        .value=${this._createUsername}
                        @input=${this._handleCreateUsernameInput}
                      />
                    </div>
                    <div class="form-group">
                      <label for="create-password"
                        >Initial Password / كلمة المرور الأولية</label
                      >
                      <input
                        id="create-password"
                        type="password"
                        placeholder="At least 8 characters"
                        .value=${this._createPassword}
                        @input=${this._handleCreatePasswordInput}
                      />
                      <span class="helper-text"
                        >Minimum 8 characters required.</span
                      >
                    </div>
                  </div>
                  <div class="dialog-footer">
                    <ha-button
                      @click=${this._closeCreateDialog}
                      .disabled=${this._submitting}
                    >
                      Cancel / إلغاء
                    </ha-button>
                    <ha-button
                      raised
                      @click=${this._handleCreateMember}
                      .disabled=${this._submitting}
                    >
                      Create Member / إنشاء
                    </ha-button>
                  </div>
                </div>
              </div>
            `:s.s6}

        <!-- Change Password Dialog -->
        ${this._showPasswordDialog&&this._selectedUserForPassword?s.qy`
              <div class="dialog-backdrop">
                <div class="dialog-box">
                  <div class="dialog-header">
                    <h2>Change Password / تغيير كلمة المرور</h2>
                    <button
                      class="icon-button"
                      @click=${this._closePasswordDialog}
                    >
                      <ha-svg-icon .path=${y}></ha-svg-icon>
                    </button>
                  </div>
                  <div class="dialog-body">
                    <p class="target-summary">
                      Target Member:
                      <strong
                        >${this._selectedUserForPassword.display_name}</strong
                      >
                      (@${this._selectedUserForPassword.username})
                    </p>
                    <div class="form-group">
                      <label for="new-password"
                        >New Password / كلمة المرور الجديدة</label
                      >
                      <input
                        id="new-password"
                        type="password"
                        placeholder="At least 8 characters"
                        .value=${this._newPassword}
                        @input=${this._handleNewPasswordInput}
                      />
                      <span class="helper-text"
                        >Minimum 8 characters required.</span
                      >
                    </div>
                  </div>
                  <div class="dialog-footer">
                    <ha-button
                      @click=${this._closePasswordDialog}
                      .disabled=${this._submitting}
                    >
                      Cancel / إلغاء
                    </ha-button>
                    <ha-button
                      raised
                      @click=${this._handleChangePassword}
                      .disabled=${this._submitting}
                    >
                      Save Password / حفظ
                    </ha-button>
                  </div>
                </div>
              </div>
            `:s.s6}

        <!-- Delete Member Confirmation Dialog -->
        ${this._showDeleteDialog&&this._selectedUserForDelete?s.qy`
              <div class="dialog-backdrop">
                <div class="dialog-box">
                  <div class="dialog-header">
                    <h2>Delete Family Member / حذف فرد من العائلة</h2>
                    <button
                      class="icon-button"
                      @click=${this._closeDeleteDialog}
                    >
                      <ha-svg-icon .path=${y}></ha-svg-icon>
                    </button>
                  </div>
                  <div class="dialog-body">
                    <p class="target-summary">
                      Are you sure you want to delete family member
                      <strong
                        >"${this._selectedUserForDelete.display_name}"
                        (@${this._selectedUserForDelete.username})</strong
                      >? This action will permanently remove the Home Assistant
                      user account and cannot be undone.
                    </p>
                  </div>
                  <div class="dialog-footer">
                    <ha-button
                      @click=${this._closeDeleteDialog}
                      .disabled=${this._submitting}
                    >
                      Cancel / إلغاء
                    </ha-button>
                    <ha-button
                      raised
                      class="destructive"
                      @click=${this._handleConfirmDeleteMember}
                      .disabled=${this._submitting}
                    >
                      Delete Member / حذف
                    </ha-button>
                  </div>
                </div>
              </div>
            `:s.s6}

        <!-- Permission Management Dialog -->
        ${this._showPermissionDialog&&this._selectedUserForPermissions?s.qy`
              <div class="dialog-backdrop">
                <div class="dialog-box dialog-full">
                  <div class="dialog-header">
                    <h2>
                      Permissions / الصلاحيات —
                      ${this._selectedUserForPermissions.display_name}
                      (@${this._selectedUserForPermissions.username})
                    </h2>
                    <button
                      class="icon-button"
                      @click=${this._closePermissionDialog}
                    >
                      <ha-svg-icon .path=${y}></ha-svg-icon>
                    </button>
                  </div>
                  <div class="dialog-body">
                    <!-- Navigation Tabs -->
                    <div class="permission-tabs">
                      <button
                        class="tab-btn ${"devices"===this._activePermissionTab?"active":""}"
                        @click=${()=>{this._activePermissionTab="devices"}}
                      >
                        <ha-svg-icon .path=${k}></ha-svg-icon>
                        <span>Household devices</span>
                      </button>
                      <button
                        class="tab-btn ${"dashboards"===this._activePermissionTab?"active":""}"
                        @click=${()=>{this._activePermissionTab="dashboards"}}
                      >
                        <ha-svg-icon .path=${x}></ha-svg-icon>
                        <span>Dashboards and views</span>
                      </button>
                      <button
                        class="tab-btn ${"diagnostics"===this._activePermissionTab?"active":""}"
                        @click=${()=>{this._activePermissionTab="diagnostics"}}
                      >
                        <ha-svg-icon .path=${L}></ha-svg-icon>
                        <span>Advanced diagnostics</span>
                      </button>
                    </div>

                    ${"devices"===this._activePermissionTab?this._renderHouseholdDevicesTab():"dashboards"===this._activePermissionTab?this._renderDashboardsTab():this._renderDiagnosticsTab()}
                  </div>
                  <div class="dialog-footer">
                    <ha-button
                      @click=${this._handleResetPermissions}
                      .disabled=${this._submitting}
                      class="destructive"
                    >
                      Reset Permissions / إعادة تعيين
                    </ha-button>
                    <ha-button
                      @click=${this._closePermissionDialog}
                      .disabled=${this._submitting}
                    >
                      Close / إغلاق
                    </ha-button>
                  </div>
                </div>
              </div>
            `:s.s6}
      </div>
    `:s.qy`
        <div class="content" dir="auto">
          <ha-alert alert-type="warning" title="Access Denied">
            <div class="alert-content">
              <ha-svg-icon .path=${g}></ha-svg-icon>
              <span>
                Father privilege required to view or manage family members. يلزم
                وجود صلاحيات الأب المسؤول لإدارة أفراد العائلة.
              </span>
            </div>
          </ha-alert>
        </div>
      `}_renderHouseholdDevicesTab(){if(this._catalogLoading)return s.qy`
        <div class="loading-container">
          <ha-progress-ring active></ha-progress-ring>
          <span>Loading household devices...</span>
        </div>
      `;const e=this._getAvailableRooms(),t=this._getFilteredDevices();return s.qy`
      <div class="filter-toolbar">
        <div class="search-box">
          <ha-svg-icon .path=${A}></ha-svg-icon>
          <input
            type="text"
            placeholder="Search devices by name..."
            .value=${this._deviceSearchQuery}
            @input=${e=>{this._deviceSearchQuery=e.target.value}}
          />
        </div>
        <div class="room-filter">
          <select
            .value=${this._deviceRoomFilter}
            @change=${e=>{this._deviceRoomFilter=e.target.value}}
          >
            <option value="all">All rooms</option>
            ${e.map(e=>s.qy`<option value=${e}>${e}</option>`)}
          </select>
        </div>
      </div>

      ${0===t.length?s.qy`
            <div class="empty-state">
              <p>
                ${0===this._catalogDevices.length?"No household devices found.":"No household devices match the search or room filter."}
              </p>
            </div>
          `:s.qy`
            <div class="device-list">
              ${t.map(e=>{const t=this._getEffectiveDeviceLevel(e),r=this._expandedDeviceIds.has(e.device_id);return s.qy`
                  <div class="device-card">
                    <div class="device-main-row">
                      <div class="device-icon-container">
                        <ha-svg-icon
                          .path=${this._getDomainIconPath(e.domain)}
                        ></ha-svg-icon>
                      </div>
                      <div class="device-info">
                        <div class="device-name-row">
                          <span class="device-name">${e.name}</span>
                          ${e.area_name?s.qy`<span class="area-badge"
                                >${e.area_name}</span
                              >`:s.s6}
                          ${"entity"===e.target_type?s.qy`<span class="standalone-badge"
                                >Standalone</span
                              >`:s.s6}
                          ${e.is_multi_entity?s.qy`<span class="multi-badge"
                                >${e.channels.length} channels</span
                              >`:s.s6}
                        </div>
                        <div class="device-meta">
                          ${e.primary_entity_id?s.qy`<span class="entity-id-meta"
                                >${e.primary_entity_id}</span
                              > • `:s.s6}
                          Capabilities: ${e.capabilities.join(", ")}
                        </div>
                      </div>
                      <div class="device-permission-controls">
                        <div class="segmented-control">
                          <button
                            class="seg-btn ${"none"===t?"active-deny":""}"
                            @click=${()=>this._handleSetDevicePermission(e,"none")}
                            .disabled=${this._submitting}
                          >
                            Deny
                          </button>
                          <button
                            class="seg-btn ${"read"===t?"active-read":""}"
                            @click=${()=>this._handleSetDevicePermission(e,"read")}
                            .disabled=${this._submitting}
                          >
                            Read
                          </button>
                          <button
                            class="seg-btn ${"control"===t?"active-control":""}"
                            @click=${()=>this._handleSetDevicePermission(e,"control")}
                            .disabled=${this._submitting}
                          >
                            Control
                          </button>
                        </div>
                        ${e.is_multi_entity?s.qy`
                              <button
                                class="icon-button expand-btn"
                                @click=${()=>this._toggleExpandDevice(e.device_id)}
                                title="Expand channels"
                              >
                                <ha-svg-icon
                                  .path=${r?C:w}
                                ></ha-svg-icon>
                              </button>
                            `:s.s6}
                      </div>
                    </div>
                    ${e.is_multi_entity&&r?s.qy`
                          <div class="channels-expansion">
                            <div class="channels-header">
                              <span>Individual channels</span>
                              <div class="channels-actions">
                                <ha-button
                                  size="small"
                                  @click=${()=>this._handleSelectAllChannels(e,"control")}
                                  .disabled=${this._submitting}
                                >
                                  Select all control
                                </ha-button>
                                <ha-button
                                  size="small"
                                  @click=${()=>this._handleSelectAllChannels(e,"none")}
                                  .disabled=${this._submitting}
                                >
                                  Select all deny
                                </ha-button>
                              </div>
                            </div>
                            <div class="channels-list">
                              ${e.channels.map(e=>{const t=this._getEffectiveChannelLevel(e.entity_id);return s.qy`
                                  <div class="channel-row">
                                    <div class="channel-info">
                                      <ha-svg-icon
                                        .path=${this._getDomainIconPath(e.domain)}
                                      ></ha-svg-icon>
                                      <span class="channel-name"
                                        >${e.name}</span
                                      >
                                      <span class="channel-entity-id"
                                        >(${e.entity_id})</span
                                      >
                                    </div>
                                    <div class="segmented-control small">
                                      <button
                                        class="seg-btn ${"none"===t?"active-deny":""}"
                                        @click=${()=>this._handleSetChannelPermission(e,"none")}
                                        .disabled=${this._submitting}
                                      >
                                        Deny
                                      </button>
                                      <button
                                        class="seg-btn ${"read"===t?"active-read":""}"
                                        @click=${()=>this._handleSetChannelPermission(e,"read")}
                                        .disabled=${this._submitting}
                                      >
                                        Read
                                      </button>
                                      <button
                                        class="seg-btn ${"control"===t?"active-control":""}"
                                        @click=${()=>this._handleSetChannelPermission(e,"control")}
                                        .disabled=${this._submitting}
                                      >
                                        Control
                                      </button>
                                    </div>
                                  </div>
                                `})}
                            </div>
                          </div>
                        `:s.s6}
                  </div>
                `})}
            </div>
          `}
    `}_renderDashboardsTab(){if(this._catalogLoading)return s.qy`
        <div class="loading-container">
          <ha-progress-ring active></ha-progress-ring>
          <span>Loading dashboards and views...</span>
        </div>
      `;if(0===this._catalogDashboards.length)return s.qy`
        <div class="empty-state">
          <p>No dashboards found.</p>
        </div>
      `;const e=this._getFilteredDashboards();return s.qy`
      <div class="filter-toolbar">
        <div class="search-box">
          <ha-svg-icon .path=${A}></ha-svg-icon>
          <input
            type="text"
            placeholder="Search dashboards and views..."
            .value=${this._dashboardSearchQuery}
            @input=${e=>{this._dashboardSearchQuery=e.target.value}}
          />
        </div>
        <div class="room-filter dashboard-select-container">
          <select
            class="dashboard-select"
            .value=${this._selectedDashboardId}
            @change=${e=>{this._selectedDashboardId=e.target.value}}
          >
            <option value="all">
              All dashboards (${this._catalogDashboards.length})
            </option>
            ${this._catalogDashboards.map(e=>s.qy`<option value=${e.dashboard_id}>
                  ${e.title}
                </option>`)}
          </select>
        </div>
      </div>

      <div class="dashboard-selector-chips">
        <button
          class="dash-chip ${"all"===this._selectedDashboardId?"active":""}"
          @click=${()=>{this._selectedDashboardId="all"}}
        >
          <ha-svg-icon .path=${M}></ha-svg-icon>
          <span>All dashboards</span>
        </button>
        ${this._catalogDashboards.map(e=>s.qy`
            <button
              class="dash-chip ${this._selectedDashboardId===e.dashboard_id?"active":""}"
              @click=${()=>{this._selectedDashboardId=e.dashboard_id}}
            >
              <ha-svg-icon .path=${x}></ha-svg-icon>
              <span>${e.title}</span>
              <span class="chip-count">${e.views.length}</span>
            </button>
          `)}
      </div>

      ${0===e.length?s.qy`
            <div class="empty-state">
              <p>No dashboards match the selected filter.</p>
            </div>
          `:s.qy`
            <div class="dashboards-list">
              ${e.map(e=>s.qy`
                  <div
                    class="dashboard-block"
                    data-dashboard-id=${e.dashboard_id}
                  >
                    <div
                      class="dashboard-title ${this._selectedDashboardId===e.dashboard_id?"selected-focus":""}"
                    >
                      <ha-svg-icon .path=${M}></ha-svg-icon>
                      <h3>${e.title}</h3>
                      <span class="views-count-badge"
                        >${e.views.length} views</span
                      >
                      ${this._selectedDashboardId===e.dashboard_id?s.qy`
                            <button
                              class="show-all-btn"
                              @click=${e=>{e.stopPropagation(),this._selectedDashboardId="all"}}
                            >
                              Show all
                            </button>
                          `:s.s6}
                    </div>
                    <div class="views-grid">
                ${e.views.map(e=>{const t=this._userPermissionSet?.view_rules[e.view_path],r=t?.access_level||("allow"===t?.effect?"control":"none"),a=this._expandedDashboardIds.has(e.view_path);return s.qy`
                    <div class="view-card">
                      <div class="view-card-header">
                        <div class="view-title-row">
                          <ha-svg-icon .path=${x}></ha-svg-icon>
                          <span class="view-title">${e.title}</span>
                        </div>
                        <div class="segmented-control">
                          <button
                            class="seg-btn ${"none"===r?"active-deny":""}"
                            @click=${()=>this._handleSetViewRuleDirect(e.view_path,"none")}
                            .disabled=${this._submitting}
                          >
                            Deny
                          </button>
                          <button
                            class="seg-btn ${"read"===r?"active-read":""}"
                            @click=${()=>this._handleSetViewRuleDirect(e.view_path,"read")}
                            .disabled=${this._submitting}
                          >
                            Read
                          </button>
                          <button
                            class="seg-btn ${"control"===r?"active-control":""}"
                            @click=${()=>this._handleSetViewRuleDirect(e.view_path,"control")}
                            .disabled=${this._submitting}
                          >
                            Control
                          </button>
                        </div>
                      </div>
                      ${e.entities.length>0?s.qy`
                            <div class="view-entities-section">
                              <button
                                class="expand-entities-toggle"
                                @click=${()=>this._toggleExpandDashboard(e.view_path)}
                              >
                                <span>${e.entities.length} referenced devices/entities</span>
                                <ha-svg-icon
                                  .path=${a?C:w}
                                ></ha-svg-icon>
                              </button>
                              ${a?s.qy`
                                    <div class="view-entities-list">
                                      ${e.entities.map(e=>{const t=this._getExplicitEntityOverrideLevel(e);return s.qy`
                                          <div class="view-entity-item">
                                            <span class="view-entity-name"
                                              >${this._lookupDeviceOrEntityName(e)}</span
                                            >
                                            <div class="override-selector">
                                              <select
                                                .value=${t||"inherited"}
                                                @change=${t=>this._handleSetEntityOverride(e,t.target.value)}
                                                .disabled=${this._submitting}
                                              >
                                                <option value="inherited">
                                                  Inherited (${r})
                                                </option>
                                                <option value="none">
                                                  Explicit deny
                                                </option>
                                                <option value="read">
                                                  Explicit read
                                                </option>
                                                <option value="control">
                                                  Explicit control
                                                </option>
                                              </select>
                                            </div>
                                          </div>
                                        `})}
                                    </div>
                                  `:s.s6}
                            </div>
                          `:s.s6}
                    </div>
                  `})}
                    </div>
                  </div>
                `)}
            </div>
          `}
    `}_renderDiagnosticsTab(){return s.qy`
      <!-- Default Access Level -->
      <ha-card>
        <div class="card-content">
          <h3>Default Access Level / مستوى الوصول الافتراضي</h3>
          <div class="form-group">
            <select
              .value=${this._userPermissionSet?.default_access_level||"none"}
              @change=${e=>this._handleSetDefaultAccessLevel(e.target.value)}
            >
              <option value="none">None / لا شيء</option>
              <option value="read">Read / قراءة</option>
              <option value="control">Control / تحكم</option>
            </select>
          </div>
        </div>
      </ha-card>

      <!-- Entity Rules -->
      <ha-card>
        <div class="card-content">
          <h3>Entity / Device / Area Rules / القواعد</h3>
          <div class="form-row">
            <select
              .value=${this._newRuleTargetType}
              @change=${e=>{this._newRuleTargetType=e.target.value}}
            >
              <option value="entity">Entity / كيان</option>
              <option value="device">Device / جهاز</option>
              <option value="area">Area / منطقة</option>
            </select>
            <input
              type="text"
              placeholder="Target ID / المعرف"
              .value=${this._newRuleTargetId}
              @input=${e=>{this._newRuleTargetId=e.target.value}}
            />
            <select
              .value=${this._newRuleAccessLevel}
              @change=${e=>{this._newRuleAccessLevel=e.target.value}}
            >
              <option value="none">None / لا شيء</option>
              <option value="read">Read / قراءة</option>
              <option value="control">Control / تحكم</option>
            </select>
            <ha-button
              @click=${this._handleAddEntityRule}
              .disabled=${this._submitting||!this._newRuleTargetId.trim()}
            >
              Add / إضافة
            </ha-button>
          </div>
          ${this._userPermissionSet&&0===Object.keys(this._userPermissionSet.entity_rules).length?s.qy`<p class="empty-state-text"
                >No entity rules / لا توجد قواعد</p
              >`:s.s6}
          <div class="rules-list">
            ${this._userPermissionSet?Object.values(this._userPermissionSet.entity_rules).map(e=>s.qy`
                    <div class="rule-row">
                      <span>
                        <strong>${e.target_type}</strong>/${e.target_id} →
                        ${e.access_level}
                      </span>
                      <ha-button
                        size="small"
                        class="destructive"
                        @click=${()=>this._handleRemoveEntityRule(e.rule_id)}
                        .disabled=${this._submitting}
                      >
                        Remove / حذف
                      </ha-button>
                    </div>
                  `):s.s6}
          </div>
        </div>
      </ha-card>

      <!-- View Rules -->
      <ha-card>
        <div class="card-content">
          <h3>View Rules / قواعد العرض</h3>
          <div class="form-row">
            <input
              type="text"
              placeholder="View path / المسار"
              .value=${this._newViewPath}
              @input=${e=>{this._newViewPath=e.target.value}}
            />
            <select
              .value=${this._newViewEffect}
              @change=${e=>{this._newViewEffect=e.target.value}}
            >
              <option value="allow">Allow / سماح</option>
              <option value="deny">Deny / منع</option>
            </select>
            <ha-button
              @click=${this._handleAddViewRule}
              .disabled=${this._submitting||!this._newViewPath.trim()}
            >
              Add / إضافة
            </ha-button>
          </div>
          <div class="rules-list">
            ${this._userPermissionSet?Object.values(this._userPermissionSet.view_rules).map(e=>s.qy`
                    <div class="rule-row">
                      <span>
                        <strong>${e.view_path}</strong>
                        → ${e.effect}
                      </span>
                      <ha-button
                        size="small"
                        class="destructive"
                        @click=${()=>this._handleRemoveViewRule(e.view_path)}
                        .disabled=${this._submitting}
                      >
                        Remove / حذف
                      </ha-button>
                    </div>
                  `):s.s6}
          </div>
        </div>
      </ha-card>

      <!-- Evaluation Preview -->
      <ha-card>
        <div class="card-content">
          <h3>Evaluation Preview / معاينة التقييم</h3>
          <div class="form-row">
            <select
              .value=${this._evalTargetType}
              @change=${e=>{this._evalTargetType=e.target.value}}
            >
              <option value="entity">Entity</option>
              <option value="device">Device</option>
              <option value="area">Area</option>
              <option value="view">View</option>
            </select>
            <input
              type="text"
              placeholder="Target ID / View path"
              .value=${this._evalTargetId}
              @input=${e=>{this._evalTargetId=e.target.value}}
            />
            <ha-button
              @click=${this._handleEvaluatePermission}
              .disabled=${this._submitting||!this._evalTargetId.trim()}
            >
              Evaluate / قيّم
            </ha-button>
          </div>
          ${this._evalResult?s.qy`
                <div class="eval-result">
                  <p>
                    Result / النتيجة:
                    <strong
                      >${this._evalResult.effect||this._evalResult.access_level||"N/A"}</strong
                    >
                    ${this._evalResult.matching_rule_type?s.qy` (matched:
                          ${this._evalResult.matching_rule_type}
                          / rule:
                          ${this._evalResult.matching_rule_id})`:s.s6}
                  </p>
                </div>
              `:s.s6}
        </div>
      </ha-card>
    `}constructor(...e){super(...e),this._loading=!0,this._submitting=!1,this._isFather=!1,this._familyMembers=[],this._error=null,this._success=null,this._showCreateDialog=!1,this._showPasswordDialog=!1,this._selectedUserForPassword=null,this._showDeleteDialog=!1,this._selectedUserForDelete=null,this._showPermissionDialog=!1,this._selectedUserForPermissions=null,this._userPermissionSet=null,this._newDefaultAccessLevel="none",this._newRuleTargetType="entity",this._newRuleTargetId="",this._newRuleAccessLevel="none",this._newViewPath="",this._newViewEffect="deny",this._evalTargetType="entity",this._evalTargetId="",this._evalResult=null,this._activePermissionTab="devices",this._catalogDevices=[],this._catalogDashboards=[],this._catalogLoading=!1,this._deviceSearchQuery="",this._deviceRoomFilter="all",this._expandedDeviceIds=new Set,this._expandedDashboardIds=new Set,this._selectedDashboardId="all",this._dashboardSearchQuery="",this._createDisplayName="",this._createUsername="",this._createPassword="",this._newPassword=""}}N.styles=s.AH`
    :host {
      display: block;
      padding: var(--ha-space-4, 16px);
      background-color: var(--primary-background-color);
      color: var(--primary-text-color);
    }

    .content {
      max-width: 1000px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: var(--ha-space-4, 16px);
    }

    .header-section {
      display: flex;
      align-items: center;
      gap: var(--ha-space-4, 16px);
      flex-wrap: wrap;
    }

    .header-icon {
      width: 48px;
      height: 48px;
      color: var(--primary-color);
    }

    .header-text {
      flex: 1;
      min-width: 250px;
    }

    h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 500;
    }

    .subtitle {
      margin: var(--ha-space-1, 4px) 0 0 0;
      color: var(--secondary-text-color);
      font-size: 0.9rem;
    }

    .header-actions {
      display: flex;
      gap: var(--ha-space-2, 8px);
    }

    ha-card {
      border-radius: var(--ha-card-border-radius, 12px);
    }

    .card-content {
      padding: var(--ha-space-4, 16px);
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 200px;
      gap: 16px;
    }

    .alert-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .table-container {
      overflow-x: auto;
    }

    .member-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .member-table th {
      padding: 12px;
      border-bottom: 2px solid var(--divider-color, #e0e0e0);
      color: var(--secondary-text-color);
      font-weight: 600;
      font-size: 0.85rem;
      text-transform: uppercase;
    }

    .member-table td {
      padding: 12px;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
      vertical-align: middle;
    }

    .display-name {
      font-weight: 500;
    }

    .username-cell {
      color: var(--secondary-text-color);
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .status-badge.active {
      background-color: var(--state-active-color, rgba(3, 169, 244, 0.15));
      color: var(--primary-color);
    }

    .status-badge.disabled {
      background-color: var(--warning-color-subtle, rgba(255, 152, 0, 0.15));
      color: var(--warning-color, #ff9800);
    }

    .id-cell code {
      font-family: monospace;
      font-size: 0.8rem;
      background: var(--secondary-background-color, #f5f5f5);
      padding: 2px 6px;
      border-radius: 4px;
    }

    .actions-cell {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    ha-button.destructive {
      --mdc-theme-primary: var(--error-color, #db4437);
      color: var(--error-color, #db4437);
    }

    .empty-state {
      text-align: center;
      padding: 32px 16px;
      color: var(--secondary-text-color);
    }

    /* Dialog Styles */
    .dialog-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }

    .dialog-box {
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #000);
      border-radius: 12px;
      width: 100%;
      max-width: 480px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
    }

    .dialog-header h2 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 500;
    }

    .icon-button {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--secondary-text-color);
      padding: 4px;
    }

    .dialog-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .target-summary {
      margin: 0;
      color: var(--secondary-text-color);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label {
      font-size: 0.9rem;
      font-weight: 500;
    }

    .form-group input {
      padding: 10px 12px;
      border-radius: 6px;
      border: 1px solid var(--divider-color, #ccc);
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #000);
      font-size: 1rem;
    }

    .form-group input:focus {
      outline: none;
      border-color: var(--primary-color);
    }

    .helper-text {
      font-size: 0.8rem;
      color: var(--secondary-text-color);
    }

    /* Permission Tabs */
    .permission-tabs {
      display: flex;
      gap: var(--ha-space-2, 8px);
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
      padding-bottom: var(--ha-space-2, 8px);
      margin-bottom: var(--ha-space-3, 12px);
      flex-wrap: wrap;
    }

    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--ha-space-2, 8px);
      padding: var(--ha-space-2, 8px) var(--ha-space-4, 16px);
      background: none;
      border: 1px solid transparent;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.95rem;
      font-weight: 500;
      color: var(--secondary-text-color);
      transition: all 0.2s ease;
    }

    .tab-btn:hover {
      background-color: var(--secondary-background-color, #f5f5f5);
    }

    .tab-btn.active {
      color: var(--primary-color);
      background-color: var(--primary-color-subtle, rgba(3, 169, 244, 0.12));
      border-color: var(--primary-color);
    }

    /* Filter Toolbar */
    .filter-toolbar {
      display: flex;
      gap: var(--ha-space-2, 8px);
      margin-bottom: var(--ha-space-4, 16px);
      flex-wrap: wrap;
    }

    .search-box {
      flex: 1;
      min-width: 200px;
      display: flex;
      align-items: center;
      gap: var(--ha-space-2, 8px);
      padding: var(--ha-space-2, 8px) var(--ha-space-3, 12px);
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 8px;
      background: var(--card-background-color, #fff);
    }

    .search-box input {
      border: none;
      outline: none;
      background: transparent;
      width: 100%;
      color: var(--primary-text-color);
      font-size: 0.95rem;
    }

    .room-filter select {
      padding: var(--ha-space-2, 8px) var(--ha-space-3, 12px);
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 8px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color);
      font-size: 0.95rem;
      height: 100%;
    }

    /* Device List & Card */
    .device-list {
      display: flex;
      flex-direction: column;
      gap: var(--ha-space-3, 12px);
    }

    .device-card {
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 10px;
      background: var(--card-background-color, #fff);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .device-main-row {
      display: flex;
      align-items: center;
      gap: var(--ha-space-3, 12px);
      padding: var(--ha-space-3, 12px) var(--ha-space-4, 16px);
      flex-wrap: wrap;
    }

    .device-icon-container {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background-color: var(--secondary-background-color, #f0f0f0);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary-color);
      flex-shrink: 0;
    }

    .device-info {
      flex: 1;
      min-width: 180px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .device-name-row {
      display: flex;
      align-items: center;
      gap: var(--ha-space-2, 8px);
      flex-wrap: wrap;
    }

    .device-name {
      font-weight: 600;
      font-size: 1rem;
    }

    .area-badge {
      background: var(--primary-color-subtle, rgba(3, 169, 244, 0.12));
      color: var(--primary-color);
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .multi-badge {
      background: var(--secondary-background-color, #e0e0e0);
      color: var(--secondary-text-color);
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .standalone-badge {
      background: var(--warning-color-subtle, rgba(255, 152, 0, 0.14));
      color: var(--warning-color, #ff9800);
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .entity-id-meta {
      font-family: var(--code-font-family, monospace);
      font-size: 0.75rem;
      color: var(--secondary-text-color);
    }

    .device-meta {
      font-size: 0.8rem;
      color: var(--secondary-text-color);
    }

    .device-permission-controls {
      display: flex;
      align-items: center;
      gap: var(--ha-space-2, 8px);
    }

    /* Segmented Control */
    .segmented-control {
      display: inline-flex;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 8px;
      overflow: hidden;
      background: var(--secondary-background-color, #f9f9f9);
    }

    .segmented-control.small {
      border-radius: 6px;
    }

    .seg-btn {
      background: none;
      border: none;
      padding: 6px 14px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      color: var(--primary-text-color);
      transition: background-color 0.2s, color 0.2s;
    }

    .segmented-control.small .seg-btn {
      padding: 4px 10px;
      font-size: 0.75rem;
    }

    .seg-btn:not(:last-child) {
      border-right: 1px solid var(--divider-color, #ccc);
    }

    .seg-btn.active-deny {
      background-color: var(--error-color, #db4437);
      color: #fff;
    }

    .seg-btn.active-read {
      background-color: var(--primary-color, #03a9f4);
      color: #fff;
    }

    .seg-btn.active-control {
      background-color: var(--success-color, #4caf50);
      color: #fff;
    }

    /* Channels Expansion */
    .channels-expansion {
      background-color: var(--secondary-background-color, #fbfbfb);
      border-top: 1px solid var(--divider-color, #e0e0e0);
      padding: var(--ha-space-3, 12px) var(--ha-space-4, 16px);
      display: flex;
      flex-direction: column;
      gap: var(--ha-space-2, 8px);
    }

    .channels-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
      font-size: 0.85rem;
      color: var(--secondary-text-color);
    }

    .channels-actions {
      display: flex;
      gap: var(--ha-space-2, 8px);
    }

    .channels-list {
      display: flex;
      flex-direction: column;
      gap: var(--ha-space-2, 8px);
    }

    .channel-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 10px;
      border-radius: 6px;
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #eee);
    }

    .channel-info {
      display: flex;
      align-items: center;
      gap: var(--ha-space-2, 8px);
    }

    .channel-name {
      font-size: 0.9rem;
      font-weight: 500;
    }

    .channel-entity-id {
      font-family: var(--code-font-family, monospace);
      font-size: 0.75rem;
      color: var(--secondary-text-color);
    }

    /* Dashboards Tab */
    .dashboard-select-container select {
      padding: var(--ha-space-2, 8px) var(--ha-space-3, 12px);
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 8px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color);
      font-size: 0.95rem;
      height: 100%;
    }

    .dashboard-selector-chips {
      display: flex;
      flex-wrap: wrap;
      gap: var(--ha-space-2, 8px);
      margin-bottom: var(--ha-space-3, 12px);
    }

    .dash-chip {
      display: inline-flex;
      align-items: center;
      gap: var(--ha-space-2, 8px);
      padding: 6px 14px;
      border-radius: 20px;
      border: 1px solid var(--divider-color, #ccc);
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color);
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s, border-color 0.2s, color 0.2s;
    }

    .dash-chip:hover {
      background: var(--secondary-background-color, #f5f5f5);
    }

    .dash-chip.active {
      background: var(--primary-color, #03a9f4);
      border-color: var(--primary-color, #03a9f4);
      color: #fff;
    }

    .dash-chip.active .chip-count {
      background: rgba(255, 255, 255, 0.25);
      color: #fff;
    }

    .chip-count {
      background: var(--secondary-background-color, #e0e0e0);
      color: var(--secondary-text-color);
      padding: 1px 6px;
      border-radius: 10px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .views-count-badge {
      font-size: 0.75rem;
      font-weight: 500;
      background: var(--primary-color-subtle, rgba(3, 169, 244, 0.12));
      color: var(--primary-color);
      padding: 2px 8px;
      border-radius: 6px;
      margin-left: 6px;
    }

    .show-all-btn {
      background: none;
      border: 1px solid var(--primary-color);
      border-radius: 6px;
      color: var(--primary-color);
      font-size: 0.75rem;
      padding: 2px 8px;
      cursor: pointer;
      margin-left: auto;
    }

    .show-all-btn:hover {
      background: var(--primary-color);
      color: #fff;
    }

    .dashboards-list {
      display: flex;
      flex-direction: column;
      gap: var(--ha-space-4, 16px);
    }

    .dashboard-block {
      display: flex;
      flex-direction: column;
      gap: var(--ha-space-3, 12px);
    }

    .dashboard-title {
      display: flex;
      align-items: center;
      gap: var(--ha-space-2, 8px);
      color: var(--primary-color);
    }

    .dashboard-title h3 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 600;
    }

    .views-grid {
      display: flex;
      flex-direction: column;
      gap: var(--ha-space-3, 12px);
    }

    .view-card {
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 10px;
      background: var(--card-background-color, #fff);
      padding: var(--ha-space-3, 12px) var(--ha-space-4, 16px);
      display: flex;
      flex-direction: column;
      gap: var(--ha-space-2, 8px);
    }

    .view-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--ha-space-2, 8px);
    }

    .view-title-row {
      display: flex;
      align-items: center;
      gap: var(--ha-space-2, 8px);
    }

    .view-title {
      font-weight: 600;
      font-size: 1rem;
    }

    .view-entities-section {
      border-top: 1px dashed var(--divider-color, #e0e0e0);
      padding-top: var(--ha-space-2, 8px);
      margin-top: 4px;
    }

    .expand-entities-toggle {
      display: flex;
      align-items: center;
      gap: var(--ha-space-1, 4px);
      background: none;
      border: none;
      cursor: pointer;
      color: var(--secondary-text-color);
      font-size: 0.85rem;
      padding: 0;
    }

    .view-entities-list {
      display: flex;
      flex-direction: column;
      gap: var(--ha-space-2, 8px);
      margin-top: var(--ha-space-2, 8px);
      padding-left: var(--ha-space-2, 8px);
    }

    .view-entity-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 10px;
      border-radius: 6px;
      background: var(--secondary-background-color, #fbfbfb);
    }

    .view-entity-name {
      font-size: 0.85rem;
      font-weight: 500;
    }

    .override-selector select {
      padding: 4px 8px;
      border-radius: 6px;
      border: 1px solid var(--divider-color, #ccc);
      background: var(--card-background-color, #fff);
      font-size: 0.8rem;
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 12px 20px;
      background: var(--secondary-background-color, #f9f9f9);
      border-top: 1px solid var(--divider-color, #e0e0e0);
    }
  `,(0,a.Cg)([(0,n.MZ)({attribute:!1})],N.prototype,"hass",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_loading",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_submitting",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_isFather",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_familyMembers",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_error",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_success",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_showCreateDialog",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_showPasswordDialog",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_selectedUserForPassword",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_showDeleteDialog",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_selectedUserForDelete",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_showPermissionDialog",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_selectedUserForPermissions",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_userPermissionSet",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_newDefaultAccessLevel",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_newRuleTargetType",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_newRuleTargetId",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_newRuleAccessLevel",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_newViewPath",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_newViewEffect",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_evalTargetType",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_evalTargetId",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_evalResult",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_activePermissionTab",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_catalogDevices",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_catalogDashboards",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_catalogLoading",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_deviceSearchQuery",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_deviceRoomFilter",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_expandedDeviceIds",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_expandedDashboardIds",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_selectedDashboardId",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_dashboardSearchQuery",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_createDisplayName",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_createUsername",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_createPassword",void 0),(0,a.Cg)([(0,n.wk)()],N.prototype,"_newPassword",void 0),N=(0,a.Cg)([(0,n.EM)("ha-domolux-family-manager")],N),t()}catch(e){t(e)}})},6923(e,t,r){r.a(e,async function(e,t){try{r(8111),r(1701);var a=r(3609),s=r(7983),n=r(8292),i=(r(9939),r(2725),r(6779)),o=(r(1633),r(2833)),l=r(7879),c=r(1591),d=e([i,o]);[i,o]=d.then?(await d)():d;const u="M10 17C11.1 17 12 16.1 12 15C12 13.9 11.1 13 10 13C8.9 13 8 13.9 8 15S8.9 17 10 17M16 8C17.1 8 18 8.9 18 10V20C18 21.1 17.1 22 16 22H4C2.9 22 2 21.1 2 20V10C2 8.9 2.9 8 4 8H5V6C5 3.2 7.2 1 10 1S15 3.2 15 6V8H16M10 3C8.3 3 7 4.3 7 6V8H13V6C13 4.3 11.7 3 10 3M22 13H20V7H22V13M22 17H20V15H22V17Z";class h extends s.WF{connectedCallback(){super.connectedCallback(),this._subscribePermissions()}disconnectedCallback(){super.disconnectedCallback(),this._unsubscribePermissions()}updated(e){super.updated(e),e.has("hass")&&this.hass&&(this._unsubPermissions||this._subscribePermissions()),(e.has("route")||e.has("viewPath")||e.has("panel"))&&(this._evaluateAccess(),this._allowed?this._loadView():this._clearView()),e.has("hass")&&this.hass&&this._allowed&&!this._view&&this._loadView()}_subscribePermissions(){this.hass&&(this._unsubscribePermissions(),this._unsubPermissions=(0,l.Uh)(this.hass,e=>{this._myViews=e,this._evaluateAccess(),this._loading=!1,this._allowed?this._loadView():this._clearView()}))}_unsubscribePermissions(){this._unsubPermissions&&(this._unsubPermissions(),this._unsubPermissions=void 0)}async _loadView(){if(!this.hass||this._viewLoading)return;const e=this._getViewPath();if(!e||"default"===e)return this._view=null,void(this._viewError=null);this._viewLoading=!0,this._viewError=null;try{const t=await(0,c.KZ)(this.hass,{view_path:e});this._view=t,this._subscribeViewUpdates(t.view_id)}catch(e){this._view=null,this._viewError=e?.message||String(e)}finally{this._viewLoading=!1}}_clearView(){this._unsubscribeView(),this._view=null,this._viewError=null,this._viewLoading=!1}_subscribeViewUpdates(e){this._unsubscribeView(),this.hass&&(this._unsubView=(0,c.ig)(this.hass,{view_id:e,onEvent:e=>{"deleted"===e.action?this._clearView():"updated"===e.action&&this._view&&this._loadView()}}))}_unsubscribeView(){this._unsubView&&(this._unsubView(),this._unsubView=void 0)}_getViewPath(){if(this.viewPath)return this.viewPath.trim();if(this.panel?.config?.view_path)return this.panel.config.view_path.trim();if(this.route?.path){const e=this.route.path.replace(/^\//,"").trim();if(e)return e}return"default"}_evaluateAccess(){if(!this._myViews)return void(this._allowed=!1);if(this._myViews.all_views_allowed)return void(this._allowed=!0);const e=this._getViewPath(),t=this._myViews.view_rules?.[e];this._allowed="allow"===t||"deny"!==t&&"none"!==this._myViews.default_access_level}render(){if(this._loading)return s.qy`
        <div class="center-container">
          <ha-progress-ring active></ha-progress-ring>
        </div>
      `;if(!this._allowed)return s.qy`
        <div class="access-denied-container">
          <ha-card class="access-denied-card">
            <div class="card-content">
              <div class="icon-container">
                <ha-svg-icon
                  .path=${u}
                  class="alert-icon"
                ></ha-svg-icon>
              </div>
              <h2>Access Denied / تم رفض الوصول</h2>
              <ha-alert alert-type="warning">
                You do not have permission to view this Domolux dashboard view.
                Contact the Father user to request view permissions.
              </ha-alert>
            </div>
          </ha-card>
        </div>
      `;if(this._loading||this._viewLoading)return s.qy`
        <div class="center-container">
          <ha-progress-ring active></ha-progress-ring>
        </div>
      `;if(this._viewError)return s.qy`
        <div class="access-denied-container">
          <ha-card class="access-denied-card">
            <div class="card-content">
              <ha-alert alert-type="error">${this._viewError}</ha-alert>
            </div>
          </ha-card>
        </div>
      `;if(!this._view)return s.qy`
        <div class="dashboard-content">
          <ha-card>
            <div class="card-content">
              <h2>Dashboard</h2>
              <p>No view configured for this path.</p>
            </div>
          </ha-card>
        </div>
      `;const e=(this._view.cards||[]).map(e=>{const t=(e.entities||[]).map(e=>!(!this.hass||!e.entity_id)||"control"!==e.required_access?s.qy`<div class="entity-row">
          <ha-icon .icon=${e.icon_override||"mdi:lightbulb"}></ha-icon
          ><span>${e.name_override||e.entity_id}</span>
        </div>`:s.qy`<ha-alert alert-type="warning"
            >Control not granted for ${e.entity_id}</ha-alert
          >`);return s.qy`
        <ha-card header=${e.title||e.card_type}>
          <div class="card-content">${t}</div>
        </ha-card>
      `});return s.qy`
      <div class="dashboard-content">
        <h2>${this._view.title||"Domolux Dashboard"}</h2>
        ${e}
      </div>
    `}constructor(...e){super(...e),this.narrow=!1,this._loading=!0,this._allowed=!1,this._myViews=null,this._view=null,this._viewLoading=!1,this._viewError=null}}h.styles=s.AH`
    :host {
      display: block;
      height: 100%;
      background-color: var(--primary-background-color);
    }

    .center-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      min-height: 200px;
    }

    .access-denied-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: var(--ha-space-4, 16px);
      min-height: 300px;
    }

    .access-denied-card {
      max-width: 500px;
      width: 100%;
      text-align: center;
    }

    .card-content {
      padding: var(--ha-space-6, 24px);
    }

    .icon-container {
      margin-bottom: var(--ha-space-4, 16px);
    }

    .alert-icon {
      --mdc-icon-size: 64px;
      color: var(--warning-color, #ffa600);
    }

    h2 {
      margin: 0 0 var(--ha-space-4, 16px) 0;
      color: var(--primary-text-color);
      font-size: 1.25rem;
      font-weight: 500;
    }

    .dashboard-content {
      height: 100%;
    }
  `,(0,a.Cg)([(0,n.MZ)({attribute:!1})],h.prototype,"hass",void 0),(0,a.Cg)([(0,n.MZ)({type:Boolean})],h.prototype,"narrow",void 0),(0,a.Cg)([(0,n.MZ)({attribute:!1})],h.prototype,"route",void 0),(0,a.Cg)([(0,n.MZ)({type:String,attribute:"view-path"})],h.prototype,"viewPath",void 0),(0,a.Cg)([(0,n.MZ)({attribute:!1})],h.prototype,"panel",void 0),(0,a.Cg)([(0,n.wk)()],h.prototype,"_loading",void 0),(0,a.Cg)([(0,n.wk)()],h.prototype,"_allowed",void 0),(0,a.Cg)([(0,n.wk)()],h.prototype,"_myViews",void 0),(0,a.Cg)([(0,n.wk)()],h.prototype,"_view",void 0),(0,a.Cg)([(0,n.wk)()],h.prototype,"_viewLoading",void 0),(0,a.Cg)([(0,n.wk)()],h.prototype,"_viewError",void 0),h=(0,a.Cg)([(0,n.EM)("ha-domolux-dashboard")],h),t()}catch(e){t(e)}})},9867(e,t,r){r.a(e,async function(e,t){try{r(8111),r(1701);var a=r(3609),s=r(7983),n=r(8292),i=(r(9939),r(2725),r(6779)),o=(r(1633),r(2833)),l=r(7879),c=r(1591),d=e([i,o]);[i,o]=d.then?(await d)():d;const u="M10 17C11.1 17 12 16.1 12 15C12 13.9 11.1 13 10 13C8.9 13 8 13.9 8 15S8.9 17 10 17M16 8C17.1 8 18 8.9 18 10V20C18 21.1 17.1 22 16 22H4C2.9 22 2 21.1 2 20V10C2 8.9 2.9 8 4 8H5V6C5 3.2 7.2 1 10 1S15 3.2 15 6V8H16M10 3C8.3 3 7 4.3 7 6V8H13V6C13 4.3 11.7 3 10 3M22 13H20V7H22V13M22 17H20V15H22V17Z";class h extends s.WF{connectedCallback(){super.connectedCallback(),this._subscribePermissions()}disconnectedCallback(){super.disconnectedCallback(),this._unsubscribePermissions()}updated(e){super.updated(e),e.has("hass")&&this.hass&&(this._unsubPermissions||this._subscribePermissions()),(e.has("route")||e.has("viewPath")||e.has("panel"))&&(this._evaluateAccess(),this._allowed?this._loadView():this._clearView()),e.has("hass")&&this.hass&&this._allowed&&!this._view&&this._loadView()}_subscribePermissions(){this.hass&&(this._unsubscribePermissions(),this._unsubPermissions=(0,l.Uh)(this.hass,e=>{this._myViews=e,this._evaluateAccess(),this._loading=!1,this._allowed?this._loadView():this._clearView()}))}_unsubscribePermissions(){this._unsubPermissions&&(this._unsubPermissions(),this._unsubPermissions=void 0)}async _loadView(){if(!this.hass||this._viewLoading)return;const e=this._getViewPath();if(!e||"default"===e)return this._view=null,void(this._viewError=null);this._viewLoading=!0,this._viewError=null;try{const t=await(0,c.KZ)(this.hass,{view_path:e});this._view=t,this._subscribeViewUpdates(t.view_id)}catch(e){this._view=null,this._viewError=e?.message||String(e)}finally{this._viewLoading=!1}}_clearView(){this._unsubscribeView(),this._view=null,this._viewError=null,this._viewLoading=!1}_subscribeViewUpdates(e){this._unsubscribeView(),this.hass&&(this._unsubView=(0,c.ig)(this.hass,{view_id:e,onEvent:e=>{"deleted"===e.action?this._clearView():"updated"===e.action&&this._view&&this._loadView()}}))}_unsubscribeView(){this._unsubView&&(this._unsubView(),this._unsubView=void 0)}_getViewPath(){if(this.viewPath)return this.viewPath.trim();if(this.panel?.config?.view_path)return this.panel.config.view_path.trim();if(this.route?.path){const e=this.route.path.replace(/^\//,"").trim();if("manage"===e)return"";if(e)return e}return"default"}_evaluateAccess(){if(!this._myViews)return void(this._allowed=!1);if(this._myViews.all_views_allowed)return void(this._allowed=!0);const e=this._getViewPath(),t=this._myViews.view_rules?.[e];this._allowed="allow"===t||"deny"!==t&&"none"!==this._myViews.default_access_level}render(){if(this._loading)return s.qy`
        <div class="center-container">
          <ha-progress-ring active></ha-progress-ring>
        </div>
      `;if(!this._allowed)return s.qy`
        <div class="access-denied-container">
          <ha-card class="access-denied-card">
            <div class="card-content">
              <div class="icon-container">
                <ha-svg-icon
                  .path=${u}
                  class="alert-icon"
                ></ha-svg-icon>
              </div>
              <h2>Access Denied / تم رفض الوصول</h2>
              <ha-alert alert-type="warning">
                You do not have permission to view this Domolux dashboard view.
                Contact the Father user to request view permissions.
              </ha-alert>
            </div>
          </ha-card>
        </div>
      `;if(this._loading||this._viewLoading)return s.qy`
        <div class="center-container">
          <ha-progress-ring active></ha-progress-ring>
        </div>
      `;if(this._viewError)return s.qy`
        <div class="access-denied-container">
          <ha-card class="access-denied-card">
            <div class="card-content">
              <ha-alert alert-type="error">${this._viewError}</ha-alert>
            </div>
          </ha-card>
        </div>
      `;const e=""===this._getViewPath()&&"manage"===this.route?.path?.replace(/^\//,"").trim();if(!this._view&&e)return s.qy`
        <div class="dashboard-content">
          <ha-card header="Parent Console / إدارة الوالدين">
            <div class="card-content">
              <h2>Parent Management Console</h2>
              <p>Child selector, catalog, and grants available.</p>
            </div>
          </ha-card>
        </div>
      `;if(!this._view)return s.qy`
        <div class="dashboard-content">
          <ha-card>
            <div class="card-content">
              <h2>Dashboard</h2>
              <p>No view configured for this path.</p>
            </div>
          </ha-card>
        </div>
      `;const t=(this._view.cards||[]).map(e=>{const t=(e.entities||[]).map(e=>!(!this.hass||!e.entity_id)||"control"!==e.required_access?s.qy`<div class="entity-row">
          <ha-icon .icon=${e.icon_override||"mdi:lightbulb"}></ha-icon
          ><span>${e.name_override||e.entity_id}</span>
        </div>`:s.qy`<ha-alert alert-type="warning"
            >Control not granted for ${e.entity_id}</ha-alert
          >`);return s.qy`
        <ha-card header=${e.title||e.card_type}>
          <div class="card-content">${t}</div>
        </ha-card>
      `});return s.qy`
      <div class="dashboard-content">
        <h2>${this._view.title||"Domolux Dashboard"}</h2>
        ${t}
      </div>
    `}constructor(...e){super(...e),this.narrow=!1,this._loading=!0,this._allowed=!1,this._myViews=null,this._view=null,this._viewLoading=!1,this._viewError=null}}h.styles=s.AH`
    :host {
      display: block;
      height: 100%;
      background-color: var(--primary-background-color);
    }

    .center-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      min-height: 200px;
    }

    .access-denied-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: var(--ha-space-4, 16px);
      min-height: 300px;
    }

    .access-denied-card {
      max-width: 500px;
      width: 100%;
      text-align: center;
    }

    .card-content {
      padding: var(--ha-space-6, 24px);
    }

    .icon-container {
      margin-bottom: var(--ha-space-4, 16px);
    }

    .alert-icon {
      --mdc-icon-size: 64px;
      color: var(--warning-color, #ffa600);
    }

    h2 {
      margin: 0 0 var(--ha-space-4, 16px) 0;
      color: var(--primary-text-color);
      font-size: 1.25rem;
      font-weight: 500;
    }

    .dashboard-content {
      height: 100%;
    }
  `,(0,a.Cg)([(0,n.MZ)({attribute:!1})],h.prototype,"hass",void 0),(0,a.Cg)([(0,n.MZ)({type:Boolean})],h.prototype,"narrow",void 0),(0,a.Cg)([(0,n.MZ)({attribute:!1})],h.prototype,"route",void 0),(0,a.Cg)([(0,n.MZ)({type:String,attribute:"view-path"})],h.prototype,"viewPath",void 0),(0,a.Cg)([(0,n.MZ)({attribute:!1})],h.prototype,"panel",void 0),(0,a.Cg)([(0,n.wk)()],h.prototype,"_loading",void 0),(0,a.Cg)([(0,n.wk)()],h.prototype,"_allowed",void 0),(0,a.Cg)([(0,n.wk)()],h.prototype,"_myViews",void 0),(0,a.Cg)([(0,n.wk)()],h.prototype,"_view",void 0),(0,a.Cg)([(0,n.wk)()],h.prototype,"_viewLoading",void 0),(0,a.Cg)([(0,n.wk)()],h.prototype,"_viewError",void 0),h=(0,a.Cg)([(0,n.EM)("ha-domolux-manage")],h),t()}catch(e){t(e)}})},9270(e,t,r){r.a(e,async function(e,t){try{var a=r(5636),s=r(3e3),n=r(8637),i=r(2733),o=r(2932),l=r(688),c=r(4501),d=r(2288),u=r(9409),h=r(8897),p=r(7256);const e=p.T,f="undefined"!=typeof BigInt,v=()=>{try{return Intl.DateTimeFormat().resolvedOptions().timeZone}catch(e){return}},m=globalThis.__haNativeTimeZone??=v(),g=()=>{if(m)try{Intl.DateTimeFormat.__setDefaultTimeZone(m)}catch(e){}},_=async()=>{const t=(0,h.wb)(),v=[];(0,n.Z)()&&await r.e("node_modules_formatjs_intl-getcanonicallocales_polyfill-force_js").then(r.bind(r,8507)),(0,o.Z)()&&await r.e("node_modules_formatjs_intl-locale_polyfill-force_js").then(r.bind(r,5866)),f&&(0,a.Z)(t)&&v.push(r.e("node_modules_formatjs_intl-datetimeformat_polyfill-force_js").then(r.bind(r,8556)).then(()=>e()).then(g)),f&&(0,u.Z)()&&v.push(r.e("node_modules_formatjs_intl-durationformat_polyfill-force_js").then(r.bind(r,6991))),(0,s.Z)(t)&&v.push(r.e("node_modules_formatjs_intl-displaynames_polyfill-force_js").then(r.bind(r,1696))),(0,i.Z)(t)&&v.push(r.e("node_modules_formatjs_intl-listformat_polyfill-force_js").then(r.bind(r,1883))),(0,l.Z)(t)&&v.push(r.e("node_modules_formatjs_intl-numberformat_polyfill-force_js").then(r.bind(r,8152))),(0,c.Z)(t)&&v.push(r.e("src_resources_polyfills_intl-pluralrules_ts").then(r.bind(r,4592))),(0,d.Z)(t)&&v.push(r.e("node_modules_formatjs_intl-relativetimeformat_polyfill-force_js").then(r.bind(r,168))),0!==v.length&&await Promise.allSettled(v).then(()=>(0,p.K)(t))};await(globalThis.__haIntlPolyfill??=_()),t()}catch(e){t(e)}},1)},7256(e,t,r){r.d(t,{K:()=>i,T:()=>o});r(7642),r(5024),r(1698);const a=["DateTimeFormat","DisplayNames","ListFormat","NumberFormat","RelativeTimeFormat"],s=new Set,n=async(e,t,r="__addLocaleData")=>{if("function"!=typeof Intl[e]?.[r])return;const a=`/static/locale-data/intl-${e.toLowerCase()}/${t}.json`;try{const t=await fetch(a);t.ok&&Intl[e][r](await t.json())}catch(r){console.warn(`Failed to load Intl.${e} locale data for ${t}`,{url:a,error:r})}},i=async e=>{s.has(e)||(s.add(e),await Promise.all(a.map(t=>n(t,e))))},o=()=>n("DateTimeFormat","add-all-tz","__addTZData")},8897(e,t,r){r.d(t,{wb:()=>o});r(4423),r(8111),r(116),r(8335);const a=JSON.parse('{"fragments":["app","home","my","config","lovelace","media-browser","map","notfound","profile","todo","page-authorize","page-demo","page-onboarding","custom","energy","history"],"translations":{"af":{"nativeName":"Afrikaans"},"ar":{"nativeName":"العربية","isRTL":true},"bg":{"nativeName":"Български"},"bn":{"nativeName":"বাংলা"},"bs":{"nativeName":"Bosanski"},"ca":{"nativeName":"Català"},"cs":{"nativeName":"Čeština"},"cy":{"nativeName":"Cymraeg"},"da":{"nativeName":"Dansk"},"de":{"nativeName":"Deutsch"},"el":{"nativeName":"Ελληνικά"},"en":{"nativeName":"English","hash":"c0eec4da350760214db57b4de734b25d"},"en-GB":{"nativeName":"English (GB)"},"eo":{"nativeName":"Esperanto"},"es":{"nativeName":"Español"},"es-419":{"nativeName":"Español (Latin America)"},"et":{"nativeName":"Eesti"},"eu":{"nativeName":"Euskara"},"fa":{"nativeName":"فارسی","isRTL":true},"fi":{"nativeName":"Suomi"},"fy":{"nativeName":"Frysk"},"fr":{"nativeName":"Français"},"ga":{"nativeName":"Gaeilge"},"gl":{"nativeName":"Galego"},"gsw":{"nativeName":"Schwiizerdütsch"},"he":{"nativeName":"עברית","isRTL":true},"hi":{"nativeName":"हिन्दी"},"hr":{"nativeName":"Hrvatski"},"hu":{"nativeName":"Magyar"},"hy":{"nativeName":"Հայերեն"},"id":{"nativeName":"Indonesia"},"it":{"nativeName":"Italiano"},"is":{"nativeName":"Íslenska"},"ja":{"nativeName":"日本語"},"ka":{"nativeName":"Kartuli"},"ko":{"nativeName":"한국어"},"lb":{"nativeName":"Lëtzebuergesch"},"lt":{"nativeName":"Lietuvių"},"lv":{"nativeName":"Latviešu"},"mk":{"nativeName":"Македонски"},"ml":{"nativeName":"മലയാളം"},"nl":{"nativeName":"Nederlands"},"nb":{"nativeName":"Norsk Bokmål"},"nn":{"nativeName":"Norsk Nynorsk"},"pl":{"nativeName":"Polski"},"pt":{"nativeName":"Português"},"pt-BR":{"nativeName":"Português (BR)"},"ro":{"nativeName":"Română"},"ru":{"nativeName":"Русский"},"sk":{"nativeName":"Slovenčina"},"sl":{"nativeName":"Slovenščina"},"sr":{"nativeName":"Српски"},"sr-Latn":{"nativeName":"Srpski"},"sv":{"nativeName":"Svenska"},"sq":{"nativeName":"Shqip"},"ta":{"nativeName":"தமிழ்"},"te":{"nativeName":"తెలుగు"},"th":{"nativeName":"ภาษาไทย"},"tr":{"nativeName":"Türkçe"},"uk":{"nativeName":"Українська"},"ur":{"nativeName":"اُردُو","isRTL":true},"vi":{"nativeName":"Tiếng Việt"},"zh-Hans":{"nativeName":"简体中文"},"zh-Hant":{"nativeName":"繁體中文"}}}'),s=window.localStorage||{};const n={"zh-cn":"zh-Hans","zh-sg":"zh-Hans","zh-my":"zh-Hans","zh-tw":"zh-Hant","zh-hk":"zh-Hant","zh-mo":"zh-Hant",zh:"zh-Hant"};function i(e){if(e in a.translations)return e;const t=e.toLowerCase();if(t in n)return n[t];const r=Object.keys(a.translations).find(e=>e.toLowerCase()===t);return r||(e.includes("-")?i(e.split("-")[0]):void 0)}function o(){let e;if(s.selectedLanguage)try{const t=JSON.parse(s.selectedLanguage);if(t&&(e=i(t),e))return e}catch(e){}if(navigator.languages)for(const t of navigator.languages)if(e=i(t),e)return e;return e=i(navigator.language),e||"en"}},9306(e,t,r){var a=r(4901),s=r(6823),n=TypeError;e.exports=function(e){if(a(e))return e;throw new n(s(e)+" is not a function")}},3506(e,t,r){var a=r(3925),s=String,n=TypeError;e.exports=function(e){if(a(e))return e;throw new n("Can't set "+s(e)+" as a prototype")}},7080(e,t,r){var a=r(4402).has;e.exports=function(e){return a(e),e}},4328(e,t,r){var a=r(4995),s=new a.WeakMap,n=a.set,i=a.remove;e.exports=function(e){return n(s,e,1),i(s,e),e}},6557(e,t,r){var a=r(4995).has;e.exports=function(e){return a(e),e}},6469(e,t,r){var a=r(8227),s=r(2360),n=r(4913).f,i=a("unscopables"),o=Array.prototype;void 0===o[i]&&n(o,i,{configurable:!0,value:s(null)}),e.exports=function(e){o[i][e]=!0}},679(e,t,r){var a=r(1625),s=TypeError;e.exports=function(e,t){if(a(t,e))return e;throw new s("Incorrect invocation")}},8551(e,t,r){var a=r(34),s=String,n=TypeError;e.exports=function(e){if(a(e))return e;throw new n(s(e)+" is not an object")}},9617(e,t,r){var a=r(5397),s=r(5610),n=r(6198),i=function(e){return function(t,r,i){var o=a(t),l=n(o);if(0===l)return!e&&-1;var c,d=s(i,l);if(e&&r!=r){for(;l>d;)if((c=o[d++])!=c)return!0}else for(;l>d;d++)if((e||d in o)&&o[d]===r)return e||d||0;return!e&&-1}};e.exports={includes:i(!0),indexOf:i(!1)}},7680(e,t,r){var a=r(9504);e.exports=a([].slice)},3982(e,t,r){var a,s,n=r(4576),i=r(7629),o=r(4901),l=r(2360),c=r(2787),d=r(6840),u=r(8227),h=r(6395),p="USE_FUNCTION_CONSTRUCTOR",f=u("asyncIterator"),v=n.AsyncIterator,m=i.AsyncIteratorPrototype;if(m)a=m;else if(o(v))a=v.prototype;else if(i[p]||n[p])try{s=c(c(c(Function("return async function*(){}()")()))),c(s)===Object.prototype&&(a=s)}catch(e){}a?h&&(a=l(a)):a={},o(a[f])||d(a,f,function(){return this}),e.exports=a},6319(e,t,r){var a=r(8551),s=r(9539);e.exports=function(e,t,r,n){try{return n?t(a(r)[0],r[1]):t(r)}catch(t){s(e,"throw",t)}}},2195(e,t,r){var a=r(9504),s=a({}.toString),n=a("".slice);e.exports=function(e){return n(s(e),8,-1)}},6955(e,t,r){var a=r(2140),s=r(4901),n=r(2195),i=r(8227)("toStringTag"),o=Object,l="Arguments"===n(function(){return arguments}());e.exports=a?n:function(e){var t,r,a;return void 0===e?"Undefined":null===e?"Null":"string"==typeof(r=function(e,t){try{return e[t]}catch(e){}}(t=o(e),i))?r:l?n(t):"Object"===(a=n(t))&&s(t.callee)?"Arguments":a}},7740(e,t,r){var a=r(9297),s=r(5031),n=r(7347),i=r(4913);e.exports=function(e,t,r){for(var o=s(t),l=i.f,c=n.f,d=0;d<o.length;d++){var u=o[d];a(e,u)||r&&a(r,u)||l(e,u,c(t,u))}}},2211(e,t,r){var a=r(9039);e.exports=!a(function(){function e(){}return e.prototype.constructor=null,Object.getPrototypeOf(new e)!==e.prototype})},2529(e){e.exports=function(e,t){return{value:e,done:t}}},6699(e,t,r){var a=r(3724),s=r(4913),n=r(6980);e.exports=a?function(e,t,r){return s.f(e,t,n(1,r))}:function(e,t,r){return e[t]=r,e}},6980(e){e.exports=function(e,t){return{enumerable:!(1&e),configurable:!(2&e),writable:!(4&e),value:t}}},4659(e,t,r){var a=r(3724),s=r(4913),n=r(6980);e.exports=function(e,t,r){a?s.f(e,t,n(0,r)):e[t]=r}},2106(e,t,r){var a=r(283),s=r(4913);e.exports=function(e,t,r){return r.get&&a(r.get,t,{getter:!0}),r.set&&a(r.set,t,{setter:!0}),s.f(e,t,r)}},6840(e,t,r){var a=r(4901),s=r(4913),n=r(283),i=r(9433);e.exports=function(e,t,r,o){o||(o={});var l=o.enumerable,c=void 0!==o.name?o.name:t;if(a(r)&&n(r,c,o),o.global)l?e[t]=r:i(t,r);else{try{o.unsafe?e[t]&&(l=!0):delete e[t]}catch(e){}l?e[t]=r:s.f(e,t,{value:r,enumerable:!1,configurable:!o.nonConfigurable,writable:!o.nonWritable})}return e}},6279(e,t,r){var a=r(6840);e.exports=function(e,t,r){for(var s in t)a(e,s,t[s],r);return e}},9433(e,t,r){var a=r(4576),s=Object.defineProperty;e.exports=function(e,t){try{s(a,e,{value:t,configurable:!0,writable:!0})}catch(r){a[e]=t}return t}},3724(e,t,r){var a=r(9039);e.exports=!a(function(){return 7!==Object.defineProperty({},1,{get:function(){return 7}})[1]})},4055(e,t,r){var a=r(4576),s=r(34),n=a.document,i=s(n)&&s(n.createElement);e.exports=function(e){return i?n.createElement(e):{}}},8727(e){e.exports=["constructor","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","toLocaleString","toString","valueOf"]},2839(e,t,r){var a=r(4576).navigator,s=a&&a.userAgent;e.exports=s?String(s):""},9519(e,t,r){var a,s,n=r(4576),i=r(2839),o=n.process,l=n.Deno,c=o&&o.versions||l&&l.version,d=c&&c.v8;d&&(s=(a=d.split("."))[0]>0&&a[0]<4?1:+(a[0]+a[1])),!s&&i&&(!(a=i.match(/Edge\/(\d+)/))||a[1]>=74)&&(a=i.match(/Chrome\/(\d+)/))&&(s=+a[1]),e.exports=s},6193(e,t,r){var a=r(9504),s=Error,n=a("".replace),i=String(new s("zxcasd").stack),o=/\n\s*at [^:]*:[^\n]*/,l=o.test(i);e.exports=function(e,t){if(l&&"string"==typeof e&&!s.prepareStackTrace)for(;t--;)e=n(e,o,"");return e}},747(e,t,r){var a=r(6699),s=r(6193),n=r(6249),i=Error.captureStackTrace;e.exports=function(e,t,r,o){n&&(i?i(e,t):a(e,"stack",s(r,o)))}},6249(e,t,r){var a=r(9039),s=r(6980);e.exports=!a(function(){var e=new Error("a");return!("stack"in e)||(Object.defineProperty(e,"stack",s(1,7)),7!==e.stack)})},6518(e,t,r){var a=r(4576),s=r(7347).f,n=r(6699),i=r(6840),o=r(9433),l=r(7740),c=r(2796);e.exports=function(e,t){var r,d,u,h,p,f=e.target,v=e.global,m=e.stat;if(r=v?a:m?a[f]||o(f,{}):a[f]&&a[f].prototype)for(d in t){if(h=t[d],u=e.dontCallGetSet?(p=s(r,d))&&p.value:r[d],!c(v?d:f+(m?".":"#")+d,e.forced)&&void 0!==u){if(typeof h==typeof u)continue;l(h,u)}(e.sham||u&&u.sham)&&n(h,"sham",!0),i(r,d,h,e)}}},9039(e){e.exports=function(e){try{return!!e()}catch(e){return!0}}},8745(e,t,r){var a=r(616),s=Function.prototype,n=s.apply,i=s.call;e.exports="object"==typeof Reflect&&Reflect.apply||(a?i.bind(n):function(){return i.apply(n,arguments)})},6080(e,t,r){var a=r(7476),s=r(9306),n=r(616),i=a(a.bind);e.exports=function(e,t){return s(e),void 0===t?e:n?i(e,t):function(){return e.apply(t,arguments)}}},616(e,t,r){var a=r(9039);e.exports=!a(function(){var e=function(){}.bind();return"function"!=typeof e||e.hasOwnProperty("prototype")})},9565(e,t,r){var a=r(616),s=Function.prototype.call;e.exports=a?s.bind(s):function(){return s.apply(s,arguments)}},350(e,t,r){var a=r(3724),s=r(9297),n=Function.prototype,i=a&&Object.getOwnPropertyDescriptor,o=s(n,"name"),l=o&&"something"===function(){}.name,c=o&&(!a||a&&i(n,"name").configurable);e.exports={EXISTS:o,PROPER:l,CONFIGURABLE:c}},6706(e,t,r){var a=r(9504),s=r(9306);e.exports=function(e,t,r){try{return a(s(Object.getOwnPropertyDescriptor(e,t)[r]))}catch(e){}}},7476(e,t,r){var a=r(2195),s=r(9504);e.exports=function(e){if("Function"===a(e))return s(e)}},9504(e,t,r){var a=r(616),s=Function.prototype,n=s.call,i=a&&s.bind.bind(n,n);e.exports=a?i:function(e){return function(){return n.apply(e,arguments)}}},7751(e,t,r){var a=r(4576),s=r(4901);e.exports=function(e,t){return arguments.length<2?(r=a[e],s(r)?r:void 0):a[e]&&a[e][t];var r}},1767(e){e.exports=function(e){return{iterator:e,next:e.next,done:!1}}},851(e,t,r){var a=r(6955),s=r(5966),n=r(4117),i=r(6269),o=r(8227)("iterator");e.exports=function(e){if(!n(e))return s(e,o)||s(e,"@@iterator")||i[a(e)]}},81(e,t,r){var a=r(9565),s=r(9306),n=r(8551),i=r(6823),o=r(851),l=TypeError;e.exports=function(e,t){var r=arguments.length<2?o(e):t;if(s(r))return n(a(r,e));throw new l(i(e)+" is not iterable")}},5966(e,t,r){var a=r(9306),s=r(4117);e.exports=function(e,t){var r=e[t];return s(r)?void 0:a(r)}},3789(e,t,r){var a=r(9306),s=r(8551),n=r(9565),i=r(1291),o=r(1767),l="Invalid size",c=RangeError,d=TypeError,u=Math.max,h=function(e,t){this.set=e,this.size=u(t,0),this.has=a(e.has),this.keys=a(e.keys)};h.prototype={getIterator:function(){return o(s(n(this.keys,this.set)))},includes:function(e){return n(this.has,this.set,e)}},e.exports=function(e){s(e);var t=+e.size;if(t!=t)throw new d(l);var r=i(t);if(r<0)throw new c(l);return new h(e,r)}},4576(e){var t=function(e){return e&&e.Math===Math&&e};e.exports=t("object"==typeof globalThis&&globalThis)||t("object"==typeof window&&window)||t("object"==typeof self&&self)||t("object"==typeof global&&global)||t("object"==typeof this&&this)||function(){return this}()||Function("return this")()},9297(e,t,r){var a=r(9504),s=r(8981),n=a({}.hasOwnProperty);e.exports=Object.hasOwn||function(e,t){return n(s(e),t)}},421(e){e.exports={}},397(e,t,r){var a=r(7751);e.exports=a("document","documentElement")},5917(e,t,r){var a=r(3724),s=r(9039),n=r(4055);e.exports=!a&&!s(function(){return 7!==Object.defineProperty(n("div"),"a",{get:function(){return 7}}).a})},7055(e,t,r){var a=r(9504),s=r(9039),n=r(2195),i=Object,o=a("".split);e.exports=s(function(){return!i("z").propertyIsEnumerable(0)})?function(e){return"String"===n(e)?o(e,""):i(e)}:i},3706(e,t,r){var a=r(9504),s=r(4901),n=r(7629),i=a(Function.toString);s(n.inspectSource)||(n.inspectSource=function(e){return i(e)}),e.exports=n.inspectSource},1181(e,t,r){var a,s,n,i=r(8622),o=r(4576),l=r(34),c=r(6699),d=r(9297),u=r(7629),h=r(6119),p=r(421),f="Object already initialized",v=o.TypeError,m=o.WeakMap;if(i||u.state){var g=u.state||(u.state=new m);g.get=g.get,g.has=g.has,g.set=g.set,a=function(e,t){if(g.has(e))throw new v(f);return t.facade=e,g.set(e,t),t},s=function(e){return g.get(e)||{}},n=function(e){return g.has(e)}}else{var _=h("state");p[_]=!0,a=function(e,t){if(d(e,_))throw new v(f);return t.facade=e,c(e,_,t),t},s=function(e){return d(e,_)?e[_]:{}},n=function(e){return d(e,_)}}e.exports={set:a,get:s,has:n,enforce:function(e){return n(e)?s(e):a(e,{})},getterFor:function(e){return function(t){var r;if(!l(t)||(r=s(t)).type!==e)throw new v("Incompatible receiver, "+e+" required");return r}}}},4209(e,t,r){var a=r(8227),s=r(6269),n=a("iterator"),i=Array.prototype;e.exports=function(e){return void 0!==e&&(s.Array===e||i[n]===e)}},4376(e,t,r){var a=r(2195);e.exports=Array.isArray||function(e){return"Array"===a(e)}},4901(e){var t="object"==typeof document&&document.all;e.exports=void 0===t&&void 0!==t?function(e){return"function"==typeof e||e===t}:function(e){return"function"==typeof e}},2796(e,t,r){var a=r(9039),s=r(4901),n=/#|\.prototype\./,i=function(e,t){var r=l[o(e)];return r===d||r!==c&&(s(t)?a(t):!!t)},o=i.normalize=function(e){return String(e).replace(n,".").toLowerCase()},l=i.data={},c=i.NATIVE="N",d=i.POLYFILL="P";e.exports=i},4117(e){e.exports=function(e){return null==e}},34(e,t,r){var a=r(4901);e.exports=function(e){return"object"==typeof e?null!==e:a(e)}},3925(e,t,r){var a=r(34);e.exports=function(e){return a(e)||null===e}},6395(e){e.exports=!1},5810(e,t,r){var a=r(34),s=r(1181).get;e.exports=function(e){if(!a(e))return!1;var t=s(e);return!!t&&"RawJSON"===t.type}},757(e,t,r){var a=r(7751),s=r(4901),n=r(1625),i=r(7040),o=Object;e.exports=i?function(e){return"symbol"==typeof e}:function(e){var t=a("Symbol");return s(t)&&n(t.prototype,o(e))}},507(e,t,r){var a=r(9565);e.exports=function(e,t,r){for(var s,n,i=r?e:e.iterator,o=e.next;!(s=a(o,i)).done;)if(void 0!==(n=t(s.value)))return n}},2652(e,t,r){var a=r(6080),s=r(9565),n=r(8551),i=r(6823),o=r(4209),l=r(6198),c=r(1625),d=r(81),u=r(851),h=r(9539),p=TypeError,f=function(e,t){this.stopped=e,this.result=t},v=f.prototype;e.exports=function(e,t,r){var m,g,_,y,b,w,C,x=r&&r.that,k=!(!r||!r.AS_ENTRIES),L=!(!r||!r.IS_RECORD),A=!(!r||!r.IS_ITERATOR),M=!(!r||!r.INTERRUPTED),S=a(t,x),E=function(e){var t=m;return m=void 0,t&&h(t,"normal"),new f(!0,e)},$=function(e){return k?(n(e),M?S(e[0],e[1],E):S(e[0],e[1])):M?S(e,E):S(e)};if(L)m=e.iterator;else if(A)m=e;else{if(!(g=u(e)))throw new p(i(e)+" is not iterable");if(o(g)){for(_=0,y=l(e);y>_;_++)if((b=$(e[_]))&&c(v,b))return b;return new f(!1)}m=d(e,g)}for(w=L?e.next:m.next;!(C=s(w,m)).done;){var P=C.value;try{b=$(P)}catch(e){if(!m)throw e;h(m,"throw",e)}if("object"==typeof b&&b&&c(v,b))return b}return new f(!1)}},1385(e,t,r){var a=r(9539);e.exports=function(e,t,r){for(var s=e.length-1;s>=0;s--)if(void 0!==e[s])try{r=a(e[s].iterator,t,r)}catch(e){t="throw",r=e}if("throw"===t)throw r;return r}},9539(e,t,r){var a=r(9565),s=r(8551),n=r(5966);e.exports=function(e,t,r){var i,o;s(e);try{if(!(i=n(e,"return"))){if("throw"===t)throw r;return r}i=a(i,e)}catch(e){o=!0,i=e}if("throw"===t)throw r;if(o)throw i;return s(i),r}},9462(e,t,r){var a=r(9565),s=r(2360),n=r(6699),i=r(6279),o=r(8227),l=r(1181),c=r(5966),d=r(7657).IteratorPrototype,u=r(2529),h=r(9539),p=r(1385),f=o("toStringTag"),v="IteratorHelper",m="WrapForValidIterator",g="normal",_="throw",y=l.set,b=function(e){var t=l.getterFor(e?m:v);return i(s(d),{next:function(){var r=t(this);if(e)return r.nextHandler();if(r.done)return u(void 0,!0);try{var a=r.nextHandler();return r.returnHandlerResult?a:u(a,r.done)}catch(e){throw r.done=!0,e}},return:function(){var r=t(this),s=r.iterator,n=r.done;if(r.done=!0,e){var i=c(s,"return");return i?a(i,s):u(void 0,!0)}if(n)return u(void 0,!0);if(r.inner)try{h(r.inner.iterator,g)}catch(e){return h(s,_,e)}if(r.openIters)try{p(r.openIters,g)}catch(e){if(s)return h(s,_,e);throw e}return s&&h(s,g),u(void 0,!0)}})},w=b(!0),C=b(!1);n(C,f,"Iterator Helper"),e.exports=function(e,t,r){var a=function(a,s){s?(s.iterator=a.iterator,s.next=a.next):s=a,s.type=t?m:v,s.returnHandlerResult=!!r,s.nextHandler=e,s.counter=0,s.done=!1,y(this,s)};return a.prototype=t?w:C,a}},684(e){e.exports=function(e,t){var r="function"==typeof Iterator&&Iterator.prototype[e];if(r)try{r.call({next:null},t).next()}catch(e){return!0}}},4549(e,t,r){var a=r(4576);e.exports=function(e,t){var r=a.Iterator,s=r&&r.prototype,n=s&&s[e],i=!1;if(n)try{n.call({next:function(){return{done:!0}},return:function(){i=!0}},-1)}catch(e){e instanceof t||(i=!1)}if(!i)return n}},7657(e,t,r){var a,s,n,i=r(9039),o=r(4901),l=r(34),c=r(2360),d=r(2787),u=r(6840),h=r(8227),p=r(6395),f=h("iterator"),v=!1;[].keys&&("next"in(n=[].keys())?(s=d(d(n)))!==Object.prototype&&(a=s):v=!0),!l(a)||i(function(){var e={};return a[f].call(e)!==e})?a={}:p&&(a=c(a)),o(a[f])||u(a,f,function(){return this}),e.exports={IteratorPrototype:a,BUGGY_SAFARI_ITERATORS:v}},6269(e){e.exports={}},6198(e,t,r){var a=r(8014);e.exports=function(e){return a(e.length)}},283(e,t,r){var a=r(9504),s=r(9039),n=r(4901),i=r(9297),o=r(3724),l=r(350).CONFIGURABLE,c=r(3706),d=r(1181),u=d.enforce,h=d.get,p=String,f=Object.defineProperty,v=a("".slice),m=a("".replace),g=a([].join),_=o&&!s(function(){return 8!==f(function(){},"length",{value:8}).length}),y=String(String).split("String"),b=e.exports=function(e,t,r){"Symbol("===v(p(t),0,7)&&(t="["+m(p(t),/^Symbol\(([^)]*)\).*$/,"$1")+"]"),r&&r.getter&&(t="get "+t),r&&r.setter&&(t="set "+t),(!i(e,"name")||l&&e.name!==t)&&(o?f(e,"name",{value:t,configurable:!0}):e.name=t),_&&r&&i(r,"arity")&&e.length!==r.arity&&f(e,"length",{value:r.arity});try{r&&i(r,"constructor")&&r.constructor?o&&f(e,"prototype",{writable:!1}):e.prototype&&(e.prototype=void 0)}catch(e){}var a=u(e);return i(a,"source")||(a.source=g(y,"string"==typeof t?t:"")),e};Function.prototype.toString=b(function(){return n(this)&&h(this).source||c(this)},"toString")},2248(e,t,r){var a=r(9504),s=Map.prototype;e.exports={Map,set:a(s.set),get:a(s.get),has:a(s.has),remove:a(s.delete),proto:s}},741(e){var t=Math.ceil,r=Math.floor;e.exports=Math.trunc||function(e){var a=+e;return(a>0?r:t)(a)}},7819(e,t,r){var a=r(9039);e.exports=!a(function(){var e="9007199254740993",t=JSON.rawJSON(e);return!JSON.isRawJSON(t)||JSON.stringify(t)!==e})},2603(e,t,r){var a=r(655);e.exports=function(e,t){return void 0===e?arguments.length<2?"":t:a(e)}},2360(e,t,r){var a,s=r(8551),n=r(6801),i=r(8727),o=r(421),l=r(397),c=r(4055),d=r(6119),u="prototype",h="script",p=d("IE_PROTO"),f=function(){},v=function(e){return"<"+h+">"+e+"</"+h+">"},m=function(e){e.write(v("")),e.close();var t=e.parentWindow.Object;return e=null,t},g=function(){try{a=new ActiveXObject("htmlfile")}catch(e){}var e,t,r;g="undefined"!=typeof document?document.domain&&a?m(a):(t=c("iframe"),r="java"+h+":",t.style.display="none",l.appendChild(t),t.src=String(r),(e=t.contentWindow.document).open(),e.write(v("document.F=Object")),e.close(),e.F):m(a);for(var s=i.length;s--;)delete g[u][i[s]];return g()};o[p]=!0,e.exports=Object.create||function(e,t){var r;return null!==e?(f[u]=s(e),r=new f,f[u]=null,r[p]=e):r=g(),void 0===t?r:n.f(r,t)}},6801(e,t,r){var a=r(3724),s=r(8686),n=r(4913),i=r(8551),o=r(5397),l=r(1072);t.f=a&&!s?Object.defineProperties:function(e,t){i(e);for(var r,a=o(t),s=l(t),c=s.length,d=0;c>d;)n.f(e,r=s[d++],a[r]);return e}},4913(e,t,r){var a=r(3724),s=r(5917),n=r(8686),i=r(8551),o=r(6969),l=TypeError,c=Object.defineProperty,d=Object.getOwnPropertyDescriptor,u="enumerable",h="configurable",p="writable";t.f=a?n?function(e,t,r){if(i(e),t=o(t),i(r),"function"==typeof e&&"prototype"===t&&"value"in r&&p in r&&!r[p]){var a=d(e,t);a&&a[p]&&(e[t]=r.value,r={configurable:h in r?r[h]:a[h],enumerable:u in r?r[u]:a[u],writable:!1})}return c(e,t,r)}:c:function(e,t,r){if(i(e),t=o(t),i(r),s)try{return c(e,t,r)}catch(e){}if("get"in r||"set"in r)throw new l("Accessors not supported");return"value"in r&&(e[t]=r.value),e}},7347(e,t,r){var a=r(3724),s=r(9565),n=r(8773),i=r(6980),o=r(5397),l=r(6969),c=r(9297),d=r(5917),u=Object.getOwnPropertyDescriptor;t.f=a?u:function(e,t){if(e=o(e),t=l(t),d)try{return u(e,t)}catch(e){}if(c(e,t))return i(!s(n.f,e,t),e[t])}},8480(e,t,r){var a=r(1828),s=r(8727).concat("length","prototype");t.f=Object.getOwnPropertyNames||function(e){return a(e,s)}},3717(e,t){t.f=Object.getOwnPropertySymbols},2787(e,t,r){var a=r(9297),s=r(4901),n=r(8981),i=r(6119),o=r(2211),l=i("IE_PROTO"),c=Object,d=c.prototype;e.exports=o?c.getPrototypeOf:function(e){var t=n(e);if(a(t,l))return t[l];var r=t.constructor;return s(r)&&t instanceof r?r.prototype:t instanceof c?d:null}},1625(e,t,r){var a=r(9504);e.exports=a({}.isPrototypeOf)},1828(e,t,r){var a=r(9504),s=r(9297),n=r(5397),i=r(9617).indexOf,o=r(421),l=a([].push);e.exports=function(e,t){var r,a=n(e),c=0,d=[];for(r in a)!s(o,r)&&s(a,r)&&l(d,r);for(;t.length>c;)s(a,r=t[c++])&&(~i(d,r)||l(d,r));return d}},1072(e,t,r){var a=r(1828),s=r(8727);e.exports=Object.keys||function(e){return a(e,s)}},8773(e,t){var r={}.propertyIsEnumerable,a=Object.getOwnPropertyDescriptor,s=a&&!r.call({1:2},1);t.f=s?function(e){var t=a(this,e);return!!t&&t.enumerable}:r},2967(e,t,r){var a=r(6706),s=r(34),n=r(7750),i=r(3506);e.exports=Object.setPrototypeOf||("__proto__"in{}?function(){var e,t=!1,r={};try{(e=a(Object.prototype,"__proto__","set"))(r,[]),t=r instanceof Array}catch(e){}return function(r,a){return n(r),i(a),s(r)?(t?e(r,a):r.__proto__=a,r):r}}():void 0)},4270(e,t,r){var a=r(9565),s=r(4901),n=r(34),i=TypeError;e.exports=function(e,t){var r,o;if("string"===t&&s(r=e.toString)&&!n(o=a(r,e)))return o;if(s(r=e.valueOf)&&!n(o=a(r,e)))return o;if("string"!==t&&s(r=e.toString)&&!n(o=a(r,e)))return o;throw new i("Can't convert object to primitive value")}},5031(e,t,r){var a=r(7751),s=r(9504),n=r(8480),i=r(3717),o=r(8551),l=s([].concat);e.exports=a("Reflect","ownKeys")||function(e){var t=n.f(o(e)),r=i.f;return r?l(t,r(e)):t}},8235(e,t,r){var a=r(9504),s=r(9297),n=SyntaxError,i=parseInt,o=String.fromCharCode,l=a("".charAt),c=a("".slice),d=a(/./.exec),u={'\\"':'"',"\\\\":"\\","\\/":"/","\\b":"\b","\\f":"\f","\\n":"\n","\\r":"\r","\\t":"\t"},h=/^[\da-f]{4}$/i,p=/^[\u0000-\u001F]$/;e.exports=function(e,t){for(var r=!0,a="";t<e.length;){var f=l(e,t);if("\\"===f){var v=c(e,t,t+2);if(s(u,v))a+=u[v],t+=2;else{if("\\u"!==v)throw new n('Unknown escape sequence: "'+v+'"');var m=c(e,t+=2,t+4);if(!d(h,m))throw new n("Bad Unicode escape at: "+t);a+=o(i(m,16)),t+=4}}else{if('"'===f){r=!1,t++;break}if(d(p,f))throw new n("Bad control character in string literal at: "+t);a+=f,t++}}if(r)throw new n("Unterminated string at: "+t);return{value:a,end:t}}},9167(e,t,r){var a=r(4576);e.exports=a},7750(e,t,r){var a=r(4117),s=TypeError;e.exports=function(e){if(a(e))throw new s("Can't call method on "+e);return e}},9286(e,t,r){var a=r(4402),s=r(8469),n=a.Set,i=a.add;e.exports=function(e){var t=new n;return s(e,function(e){i(t,e)}),t}},3440(e,t,r){var a=r(7080),s=r(4402),n=r(9286),i=r(5170),o=r(3789),l=r(8469),c=r(507),d=s.has,u=s.remove;e.exports=function(e){var t=a(this),r=o(e),s=n(t);return i(s)<=r.size?l(s,function(e){r.includes(e)&&u(s,e)}):c(r.getIterator(),function(e){d(s,e)&&u(s,e)}),s}},4402(e,t,r){var a=r(9504),s=Set.prototype;e.exports={Set,add:a(s.add),has:a(s.has),remove:a(s.delete),proto:s}},8469(e,t,r){var a=r(9504),s=r(507),n=r(4402),i=n.Set,o=n.proto,l=a(o.forEach),c=a(o.keys),d=c(new i).next;e.exports=function(e,t,r){return r?s({iterator:c(e),next:d},t):l(e,t)}},4916(e,t,r){var a=r(7751),s=function(e){return{size:e,has:function(){return!1},keys:function(){return{next:function(){return{done:!0}}}}}},n=function(e){return{size:e,has:function(){return!0},keys:function(){throw new Error("e")}}};e.exports=function(e,t){var r=a("Set");try{(new r)[e](s(0));try{return(new r)[e](s(-1)),!1}catch(a){if(!t)return!0;try{return(new r)[e](n(-1/0)),!1}catch(a){return t(new r([1,2])[e](n(1/0)))}}}catch(e){return!1}}},9835(e){e.exports=function(e){try{var t=new Set,r={size:0,has:function(){return!0},keys:function(){return Object.defineProperty({},"next",{get:function(){return t.clear(),t.add(4),function(){return{done:!0}}}})}},a=t[e](r);return 1===a.size&&4===a.values().next().value}catch(e){return!1}}},5170(e,t,r){var a=r(6706),s=r(4402);e.exports=a(s.proto,"size","get")||function(e){return e.size}},3650(e,t,r){var a=r(7080),s=r(4402),n=r(9286),i=r(3789),o=r(507),l=s.add,c=s.has,d=s.remove;e.exports=function(e){var t=a(this),r=i(e).getIterator(),s=n(t);return o(r,function(e){c(t,e)?d(s,e):l(s,e)}),s}},4204(e,t,r){var a=r(7080),s=r(4402).add,n=r(9286),i=r(3789),o=r(507);e.exports=function(e){var t=a(this),r=i(e).getIterator(),l=n(t);return o(r,function(e){s(l,e)}),l}},6119(e,t,r){var a=r(5745),s=r(3392),n=a("keys");e.exports=function(e){return n[e]||(n[e]=s(e))}},7629(e,t,r){var a=r(6395),s=r(4576),n=r(9433),i="__core-js_shared__",o=e.exports=s[i]||n(i,{});(o.versions||(o.versions=[])).push({version:"3.49.0",mode:a?"pure":"global",copyright:"© 2013–2025 Denis Pushkarev (zloirock.ru), 2025–2026 CoreJS Company (core-js.io). All rights reserved.",license:"https://github.com/zloirock/core-js/blob/v3.49.0/LICENSE",source:"https://github.com/zloirock/core-js"})},5745(e,t,r){var a=r(7629);e.exports=function(e,t){return a[e]||(a[e]=t||{})}},4495(e,t,r){var a=r(9519),s=r(9039),n=r(4576).String;e.exports=!!Object.getOwnPropertySymbols&&!s(function(){var e=Symbol("symbol detection");return!n(e)||!(Object(e)instanceof Symbol)||!Symbol.sham&&a&&a<41})},5610(e,t,r){var a=r(1291),s=Math.max,n=Math.min;e.exports=function(e,t){var r=a(e);return r<0?s(r+t,0):n(r,t)}},5397(e,t,r){var a=r(7055),s=r(7750);e.exports=function(e){return a(s(e))}},1291(e,t,r){var a=r(741);e.exports=function(e){var t=+e;return t!=t||0===t?0:a(t)}},8014(e,t,r){var a=r(1291),s=Math.min;e.exports=function(e){var t=a(e);return t>0?s(t,9007199254740991):0}},8981(e,t,r){var a=r(7750),s=Object;e.exports=function(e){return s(a(e))}},2777(e,t,r){var a=r(9565),s=r(34),n=r(757),i=r(5966),o=r(4270),l=r(8227),c=TypeError,d=l("toPrimitive");e.exports=function(e,t){if(!s(e)||n(e))return e;var r,l=i(e,d);if(l){if(void 0===t&&(t="default"),r=a(l,e,t),!s(r)||n(r))return r;throw new c("Can't convert object to primitive value")}return void 0===t&&(t="number"),o(e,t)}},6969(e,t,r){var a=r(2777),s=r(757);e.exports=function(e){var t=a(e,"string");return s(t)?t:t+""}},2140(e,t,r){var a={};a[r(8227)("toStringTag")]="z",e.exports="[object z]"===String(a)},655(e,t,r){var a=r(6955),s=String;e.exports=function(e){if("Symbol"===a(e))throw new TypeError("Cannot convert a Symbol value to a string");return s(e)}},6823(e){var t=String;e.exports=function(e){try{return t(e)}catch(e){return"Object"}}},3392(e,t,r){var a=r(9504),s=0,n=Math.random(),i=a(1.1.toString);e.exports=function(e){return"Symbol("+(void 0===e?"":e)+")_"+i(++s+n,36)}},7040(e,t,r){var a=r(4495);e.exports=a&&!Symbol.sham&&"symbol"==typeof Symbol.iterator},8686(e,t,r){var a=r(3724),s=r(9039);e.exports=a&&s(function(){return 42!==Object.defineProperty(function(){},"prototype",{value:42,writable:!1}).prototype})},8622(e,t,r){var a=r(4576),s=r(4901),n=a.WeakMap;e.exports=s(n)&&/native code/.test(String(n))},4995(e,t,r){var a=r(9504),s=WeakMap.prototype;e.exports={WeakMap,set:a(s.set),get:a(s.get),has:a(s.has),remove:a(s.delete)}},511(e,t,r){var a=r(9167),s=r(9297),n=r(1951),i=r(4913).f;e.exports=function(e){var t=a.Symbol||(a.Symbol={});s(t,e)||i(t,e,{value:n.f(e)})}},1951(e,t,r){var a=r(8227);t.f=a},8227(e,t,r){var a=r(4576),s=r(5745),n=r(9297),i=r(3392),o=r(4495),l=r(7040),c=a.Symbol,d=s("wks"),u=l?c.for||c:c&&c.withoutSetter||i;e.exports=function(e){return n(d,e)||(d[e]=o&&n(c,e)?c[e]:u("Symbol."+e)),d[e]}},4423(e,t,r){var a=r(6518),s=r(9617).includes,n=r(9039),i=r(6469),o=n(function(){return!Array(1).includes()}),l=n(function(){return[,1].includes(void 0,1)});a({target:"Array",proto:!0,forced:o||l},{includes:function(e){return s(this,e,arguments.length>1?arguments[1]:void 0)}}),i("includes")},452(e,t,r){var a=r(9565),s=r(6840),n=r(7751),i=r(5966),o=r(9297),l=r(8227),c=r(3982),d=l("asyncDispose"),u=n("Promise");o(c,d)||s(c,d,function(){var e=this;return new u(function(t,r){var s=i(e,"return");s?u.resolve(a(s,e)).then(function(){t(void 0)},r):t(void 0)})})},8111(e,t,r){var a=r(6518),s=r(4576),n=r(679),i=r(8551),o=r(4901),l=r(2787),c=r(2106),d=r(4659),u=r(9039),h=r(9297),p=r(8227),f=r(7657).IteratorPrototype,v=r(3724),m=r(6395),g="constructor",_="Iterator",y=p("toStringTag"),b=TypeError,w=s[_],C=m||!o(w)||w.prototype!==f||!u(function(){w({})}),x=function(){if(n(this,f),l(this)===f)throw new b("Abstract class Iterator not directly constructable")},k=function(e,t){v?c(f,e,{configurable:!0,get:function(){return t},set:function(t){if(i(this),this===f)throw new b("You can't redefine this property");h(this,e)?this[e]=t:d(this,e,t)}}):f[e]=t};h(f,y)||k(y,_),!C&&h(f,g)&&f[g]!==Object||k(g,x),x.prototype=f,a({global:!0,constructor:!0,forced:C},{Iterator:x})},6382(e,t,r){var a=r(9565),s=r(6840),n=r(5966),i=r(9297),o=r(8227),l=r(7657).IteratorPrototype,c=o("dispose");i(l,c)||s(l,c,function(){var e=n(this,"return");e&&a(e,this)})},1148(e,t,r){var a=r(6518),s=r(9565),n=r(2652),i=r(9306),o=r(8551),l=r(1767),c=r(9539),d=r(4549)("every",TypeError);a({target:"Iterator",proto:!0,real:!0,forced:d},{every:function(e){o(this);try{i(e)}catch(e){c(this,"throw",e)}if(d)return s(d,this,e);var t=l(this),r=0;return!n(t,function(t,a){if(!e(t,r++))return a()},{IS_RECORD:!0,INTERRUPTED:!0}).stopped}})},2489(e,t,r){var a=r(6518),s=r(9565),n=r(9306),i=r(8551),o=r(1767),l=r(9462),c=r(6319),d=r(6395),u=r(9539),h=r(684),p=r(4549),f=!d&&!h("filter",function(){}),v=!d&&!f&&p("filter",TypeError),m=d||f||v,g=l(function(){for(var e,t,r=this.iterator,a=this.predicate,n=this.next;;){if(e=i(s(n,r)),this.done=!!e.done)return;if(t=e.value,c(r,a,[t,this.counter++],!0))return t}});a({target:"Iterator",proto:!0,real:!0,forced:m},{filter:function(e){i(this);try{n(e)}catch(e){u(this,"throw",e)}return v?s(v,this,e):new g(o(this),{predicate:e})}})},116(e,t,r){var a=r(6518),s=r(9565),n=r(2652),i=r(9306),o=r(8551),l=r(1767),c=r(9539),d=r(4549)("find",TypeError);a({target:"Iterator",proto:!0,real:!0,forced:d},{find:function(e){o(this);try{i(e)}catch(e){c(this,"throw",e)}if(d)return s(d,this,e);var t=l(this),r=0;return n(t,function(t,a){if(e(t,r++))return a(t)},{IS_RECORD:!0,INTERRUPTED:!0}).result}})},7588(e,t,r){var a=r(6518),s=r(9565),n=r(2652),i=r(9306),o=r(8551),l=r(1767),c=r(9539),d=r(4549)("forEach",TypeError);a({target:"Iterator",proto:!0,real:!0,forced:d},{forEach:function(e){o(this);try{i(e)}catch(e){c(this,"throw",e)}if(d)return s(d,this,e);var t=l(this),r=0;n(t,function(t){e(t,r++)},{IS_RECORD:!0})}})},1701(e,t,r){var a=r(6518),s=r(9565),n=r(9306),i=r(8551),o=r(1767),l=r(9462),c=r(6319),d=r(9539),u=r(684),h=r(4549),p=r(6395),f=!p&&!u("map",function(){}),v=!p&&!f&&h("map",TypeError),m=p||f||v,g=l(function(){var e=this.iterator,t=i(s(this.next,e));if(!(this.done=!!t.done))return c(e,this.mapper,[t.value,this.counter++],!0)});a({target:"Iterator",proto:!0,real:!0,forced:m},{map:function(e){i(this);try{n(e)}catch(e){d(this,"throw",e)}return v?s(v,this,e):new g(o(this),{mapper:e})}})},8237(e,t,r){var a=r(6518),s=r(2652),n=r(9306),i=r(8551),o=r(1767),l=r(9539),c=r(4549),d=r(8745),u=r(9039),h=TypeError,p=u(function(){[].keys().reduce(function(){},void 0)}),f=!p&&c("reduce",h);a({target:"Iterator",proto:!0,real:!0,forced:p||f},{reduce:function(e){i(this);try{n(e)}catch(e){l(this,"throw",e)}var t=arguments.length<2,r=t?void 0:arguments[1];if(f)return d(f,this,t?[e]:[e,r]);var a=o(this),c=0;if(s(a,function(a){t?(t=!1,r=a):r=e(r,a,c),c++},{IS_RECORD:!0}),t)throw new h("Reduce of empty iterator with no initial value");return r}})},3579(e,t,r){var a=r(6518),s=r(9565),n=r(2652),i=r(9306),o=r(8551),l=r(1767),c=r(9539),d=r(4549)("some",TypeError);a({target:"Iterator",proto:!0,real:!0,forced:d},{some:function(e){o(this);try{i(e)}catch(e){c(this,"throw",e)}if(d)return s(d,this,e);var t=l(this),r=0;return n(t,function(t,a){if(e(t,r++))return a()},{IS_RECORD:!0,INTERRUPTED:!0}).stopped}})},9112(e,t,r){var a=r(6518),s=r(3724),n=r(4576),i=r(7751),o=r(9504),l=r(9565),c=r(4901),d=r(34),u=r(4376),h=r(9297),p=r(655),f=r(6198),v=r(4659),m=r(9039),g=r(8235),_=r(4495),y=n.JSON,b=n.Number,w=n.SyntaxError,C=y&&y.parse,x=i("Object","keys"),k=Object.getOwnPropertyDescriptor,L=o("".charAt),A=o("".slice),M=o(/./.exec),S=o([].push),E=/^\d$/,$=/^[1-9]$/,P=/^[\d-]$/,I=/^[\t\n\r ]$/,T=function(e,t,r,a){var s,n,i,o,c,p=e[t],v=a&&p===a.value,m=v&&"string"==typeof a.source?{source:a.source}:{};if(d(p)){var g=u(p),_=v?a.nodes:g?[]:{};if(g)for(s=_.length,i=f(p),o=0;o<i;o++)D(p,o,T(p,""+o,r,o<s?_[o]:void 0));else for(n=x(p),i=f(n),o=0;o<i;o++)c=n[o],D(p,c,T(p,c,r,h(_,c)?_[c]:void 0))}return l(r,e,t,p,m)},D=function(e,t,r){if(s){var a=k(e,t);if(a&&!a.configurable)return}void 0===r?delete e[t]:v(e,t,r)},z=function(e,t,r,a){this.value=e,this.end=t,this.source=r,this.nodes=a},N=function(e,t){this.source=e,this.index=t};N.prototype={fork:function(e){return new N(this.source,e)},parse:function(){var e=this.source,t=this.skip(I,this.index),r=this.fork(t),a=L(e,t);if(M(P,a))return r.number();switch(a){case"{":return r.object();case"[":return r.array();case'"':return r.string();case"t":return r.keyword(!0);case"f":return r.keyword(!1);case"n":return r.keyword(null)}throw new w('Unexpected character: "'+a+'" at: '+t)},node:function(e,t,r,a,s){return new z(t,a,e?null:A(this.source,r,a),s)},object:function(){for(var e=this.source,t=this.index+1,r=!1,a={},s={},n=!1;t<e.length;){if(t=this.until(['"',"}"],t),"}"===L(e,t)&&!r){t++,n=!0;break}var i=this.fork(t).string(),o=i.value;t=i.end,t=this.until([":"],t)+1,t=this.skip(I,t),i=this.fork(t).parse(),v(s,o,i),v(a,o,i.value),t=this.until([",","}"],i.end);var l=L(e,t);if(","===l)r=!0,t++;else if("}"===l){t++,n=!0;break}}if(!n)throw new w("Unterminated object at: "+t);return this.node(1,a,this.index,t,s)},array:function(){for(var e=this.source,t=this.index+1,r=!1,a=[],s=[],n=!1;t<e.length;){if(t=this.skip(I,t),"]"===L(e,t)&&!r){t++,n=!0;break}var i=this.fork(t).parse();if(S(s,i),S(a,i.value),t=this.until([",","]"],i.end),","===L(e,t))r=!0,t++;else if("]"===L(e,t)){t++,n=!0;break}}if(!n)throw new w("Unterminated array at: "+t);return this.node(1,a,this.index,t,s)},string:function(){var e=this.index,t=g(this.source,this.index+1);return this.node(0,t.value,e,t.end)},number:function(){var e=this.source,t=this.index,r=t;if("-"===L(e,r)&&r++,"0"===L(e,r))r++;else{if(!M($,L(e,r)))throw new w("Failed to parse number at: "+r);r=this.skip(E,r+1)}if("."===L(e,r)){var a=r+1;if(a===(r=this.skip(E,a)))throw new w("Failed to parse number's fraction at: "+r)}if(("e"===L(e,r)||"E"===L(e,r))&&(r++,"+"!==L(e,r)&&"-"!==L(e,r)||r++,r===(r=this.skip(E,r))))throw new w("Failed to parse number's exponent value at: "+r);return this.node(0,b(A(e,t,r)),t,r)},keyword:function(e){var t=""+e,r=this.index,a=r+t.length;if(A(this.source,r,a)!==t)throw new w("Failed to parse value at: "+r);return this.node(0,e,r,a)},skip:function(e,t){for(var r=this.source;t<r.length&&M(e,L(r,t));t++);return t},until:function(e,t){t=this.skip(I,t);for(var r=L(this.source,t),a=0;a<e.length;a++)if(e[a]===r)return t;throw new w('Unexpected character: "'+r+'" at: '+t)}};var H=m(function(){var e,t="9007199254740993";return C(t,function(t,r,a){e=a.source}),e!==t}),F=_&&!m(function(){return 1/C("-0 \t")!=-1/0});a({target:"JSON",stat:!0,forced:H},{parse:function(e,t){return F&&!c(t)?C(e):function(e,t){e=p(e);var r=new N(e,0,""),a=r.parse(),s=a.value,n=r.skip(I,a.end);if(n<e.length)throw new w('Unexpected extra character: "'+L(e,n)+'" after the parsed data at: '+n);return c(t)?T({"":s},"",t,a):s}(e,t)}})},3110(e,t,r){var a=r(6518),s=r(7751),n=r(8745),i=r(9565),o=r(9504),l=r(9039),c=r(4376),d=r(4901),u=r(5810),h=r(757),p=r(2195),f=r(655),v=r(7680),m=r(8235),g=r(3392),_=r(4495),y=r(7819),b=String,w=s("JSON","stringify"),C=o(/./.exec),x=o("".charAt),k=o("".charCodeAt),L=o("".replace),A=o("".slice),M=o([].push),S=o(1.1.toString),E=/[\uD800-\uDFFF]/g,$=/^[\uD800-\uDBFF]$/,P=/^[\uDC00-\uDFFF]$/,I=g(),T=I.length,D=!_||l(function(){var e=s("Symbol")("stringify detection");return"[null]"!==w([e])||"{}"!==w({a:e})||"{}"!==w(Object(e))}),z=l(function(){return'"\\udf06\\ud834"'!==w("\udf06\ud834")||'"\\udead"'!==w("\udead")}),N=D?function(e,t){var r=v(arguments),a=F(t);if(d(a)||void 0!==e&&!h(e))return r[1]=function(e,t){if(d(a)&&(t=i(a,this,b(e),t)),!h(t))return t},n(w,null,r)}:w,H=function(e,t,r){var a=x(r,t-1),s=x(r,t+1);return C($,e)&&!C(P,s)||C(P,e)&&!C($,a)?"\\u"+S(k(e,0),16):e},F=function(e){if(d(e))return e;if(c(e)){for(var t=e.length,r=[],a=0;a<t;a++){var s=e[a];"string"==typeof s?M(r,s):"number"!=typeof s&&"Number"!==p(s)&&"String"!==p(s)||M(r,f(s))}var n=r.length,i=!0;return function(e,t){if(i)return i=!1,t;if(c(this))return t;for(var a=0;a<n;a++)if(r[a]===e)return t}}};w&&a({target:"JSON",stat:!0,arity:3,forced:D||z||!y},{stringify:function(e,t,r){var a=F(t),s=[],n=N(e,function(e,t){var r=d(a)?i(a,this,b(e),t):t;return!y&&u(r)?I+(M(s,r.rawJSON)-1):r},r);if("string"!=typeof n)return n;if(z&&(n=L(n,E,H)),y)return n;for(var o="",l=n.length,c=0;c<l;c++){var h=x(n,c);if('"'===h){var p=m(n,++c).end-1,f=A(n,c,p);o+=A(f,0,T)===I?s[A(f,T)]:'"'+f+'"',c=p}else o+=h}return o}})},2731(e,t,r){var a=r(6518),s=r(9306),n=r(2248),i=r(6395),o=n.get,l=n.has,c=n.set;a({target:"Map",proto:!0,real:!0,forced:i},{getOrInsertComputed:function(e,t){var r=l(this,e);if(s(t),r)return o(this,e);0===e&&1/e==-1/0&&(e=0);var a=t(e);return c(this,e,a),a}})},5367(e,t,r){var a=r(6518),s=r(2248),n=r(6395),i=s.get,o=s.has,l=s.set;a({target:"Map",proto:!0,real:!0,forced:n},{getOrInsert:function(e,t){return o(this,e)?i(this,e):(l(this,e,t),t)}})},7642(e,t,r){var a=r(6518),s=r(3440),n=r(9039);a({target:"Set",proto:!0,real:!0,forced:!r(4916)("difference",function(e){return 0===e.size})||n(function(){var e={size:1,has:function(){return!0},keys:function(){var e=0;return{next:function(){var r=e++>1;return t.has(1)&&t.clear(),{done:r,value:2}}}}},t=new Set([1,2,3,4]);return 3!==t.difference(e).size})},{difference:s})},5024(e,t,r){var a=r(6518),s=r(3650),n=r(9835);a({target:"Set",proto:!0,real:!0,forced:!r(4916)("symmetricDifference")||!n("symmetricDifference")},{symmetricDifference:s})},1698(e,t,r){var a=r(6518),s=r(4204),n=r(9835);a({target:"Set",proto:!0,real:!0,forced:!r(4916)("union")||!n("union")},{union:s})},8940(e,t,r){var a=r(6518),s=r(4576),n=r(1625),i=r(2787),o=r(2967),l=r(7740),c=r(2360),d=r(6699),u=r(6980),h=r(747),p=r(2603),f=r(8227),v=r(9039),m=r(6395),g=s.SuppressedError,_=f("toStringTag"),y=Error,b=!!g&&3!==g.length,w=!!g&&v(function(){return 4===new g(1,2,3,{cause:4}).cause}),C=b||w,x=function(e,t,r){var a,s=n(k,this);return o?a=!C||s&&i(this)!==k?o(new y,s?i(this):k):new g:(a=s?this:c(k),d(a,_,"Error")),void 0!==r&&d(a,"message",p(r)),h(a,x,a.stack,1),d(a,"error",e),d(a,"suppressed",t),a};o?o(x,y):l(x,y,{name:!0});var k=x.prototype=C?g.prototype:c(y.prototype,{constructor:u(1,x),message:u(1,""),name:u(1,"SuppressedError")});C&&!m&&(k.constructor=x),a({global:!0,constructor:!0,arity:3,forced:C},{SuppressedError:x})},4113(e,t,r){var a=r(4576),s=r(511),n=r(4913).f,i=r(7347).f,o=a.Symbol;if(s("asyncDispose"),o){var l=i(o,"asyncDispose");l.enumerable&&l.configurable&&l.writable&&n(o,"asyncDispose",{value:l.value,enumerable:!1,configurable:!1,writable:!1})}},7324(e,t,r){var a=r(4576),s=r(511),n=r(4913).f,i=r(7347).f,o=a.Symbol;if(s("dispose"),o){var l=i(o,"dispose");l.enumerable&&l.configurable&&l.writable&&n(o,"dispose",{value:l.value,enumerable:!1,configurable:!1,writable:!1})}},9452(e,t,r){var a=r(6518),s=r(9306),n=r(6557),i=r(4328),o=r(4995),l=r(6395),c=o.get,d=o.has,u=o.set;a({target:"WeakMap",proto:!0,real:!0,forced:l||!function(){try{WeakMap.prototype.getOrInsertComputed&&(new WeakMap).getOrInsertComputed(1,function(){throw 1})}catch(e){return e instanceof TypeError}}()},{getOrInsertComputed:function(e,t){if(l||n(this),i(e),s(t),d(this,e))return c(this,e);var r=t(e);return u(this,e,r),r}})},8454(e,t,r){var a=r(6518),s=r(4995),n=r(6395),i=s.get,o=s.has,l=s.set;a({target:"WeakMap",proto:!0,real:!0,forced:n},{getOrInsert:function(e,t){return o(this,e)?i(this,e):(l(this,e,t),t)}})},8335(e,t,r){r(9112)},7036(e,t,r){r(2731)},7254(e,t,r){r(5367)},465(e,t,r){r(511)("metadata")},3525(e,t,r){r(9452)},805(e,t,r){r(8454)},1480(e,t,r){r.d(t,{B:()=>a,W:()=>u});r(3110);function a(e,t){const r=t&&t.cache?t.cache:d,a=t&&t.serializer?t.serializer:l;return(t&&t.strategy?t.strategy:o)(e,{cache:r,serializer:a})}function s(e,t,r,a){const s=null==(n=a)||"number"==typeof n||"boolean"==typeof n?a:r(a);var n;let i=t.get(s);return void 0===i&&(i=e.call(this,a),t.set(s,i)),i}function n(e,t,r){const a=Array.prototype.slice.call(arguments,3),s=r(a);let n=t.get(s);return void 0===n&&(n=e.apply(this,a),t.set(s,n)),n}function i(e,t,r,a,s){return r.bind(t,e,a,s)}function o(e,t){return i(e,this,1===e.length?s:n,t.cache.create(),t.serializer)}const l=function(){return JSON.stringify(arguments)};var c=class{get(e){return this.cache[e]}set(e,t){this.cache[e]=t}constructor(){this.cache=Object.create(null)}};const d={create:function(){return new c}},u={variadic:function(e,t){return i(e,this,n,t.cache.create(),t.serializer)},monadic:function(e,t){return i(e,this,s,t.cache.create(),t.serializer)}}},5636(e,t,r){r.d(t,{Z:()=>n});var a=r(2905);const s=["aa","aa-DJ","aa-ER","ab","af","af-NA","agq","ak","am","an","ann","apc","ar","ar-AE","ar-BH","ar-DJ","ar-DZ","ar-EG","ar-EH","ar-ER","ar-IL","ar-IQ","ar-JO","ar-KM","ar-KW","ar-LB","ar-LY","ar-MA","ar-MR","ar-OM","ar-PS","ar-QA","ar-SA","ar-SD","ar-SO","ar-SS","ar-SY","ar-TD","ar-TN","ar-YE","arn","as","asa","ast","az","az-Arab","az-Arab-IQ","az-Arab-TR","az-Cyrl","az-Latn","ba","bal","bal-Arab","bal-Latn","bas","be","be-tarask","bem","bew","bez","bg","bgc","bgn","bgn-AE","bgn-AF","bgn-IR","bgn-OM","bho","blo","blt","bm","bm-Nkoo","bn","bn-IN","bo","bo-IN","bqi","br","brx","bs","bs-Cyrl","bs-Latn","bss","bua","byn","ca","ca-AD","ca-ES-valencia","ca-FR","ca-IT","cad","cch","ccp","ccp-IN","ce","ceb","cgg","cho","chr","cic","ckb","ckb-IR","co","cop","cs","csw","cu","cv","cy","da","da-GL","dav","de","de-AT","de-BE","de-CH","de-IT","de-LI","de-LU","dje","doi","dsb","dua","dv","dyo","dz","ebu","ee","ee-TG","el","el-CY","el-polyton","en","en-001","en-150","en-AE","en-AG","en-AI","en-AS","en-AT","en-AU","en-BB","en-BE","en-BI","en-BM","en-BS","en-BW","en-BZ","en-CA","en-CC","en-CH","en-CK","en-CM","en-CX","en-CY","en-CZ","en-DE","en-DG","en-DK","en-DM","en-Dsrt","en-EE","en-ER","en-ES","en-FI","en-FJ","en-FK","en-FM","en-FR","en-GB","en-GD","en-GE","en-GG","en-GH","en-GI","en-GM","en-GS","en-GU","en-GY","en-HK","en-HU","en-ID","en-IE","en-IL","en-IM","en-IN","en-IO","en-IT","en-JE","en-JM","en-JP","en-KE","en-KI","en-KN","en-KY","en-LC","en-LR","en-LS","en-LT","en-LV","en-MG","en-MH","en-MO","en-MP","en-MS","en-MT","en-MU","en-MV","en-MW","en-MY","en-NA","en-NF","en-NG","en-NL","en-NO","en-NR","en-NU","en-NZ","en-PG","en-PH","en-PK","en-PL","en-PN","en-PR","en-PT","en-PW","en-RO","en-RW","en-SB","en-SC","en-SD","en-SE","en-SG","en-SH","en-SI","en-SK","en-SL","en-SS","en-SX","en-SZ","en-Shaw","en-TC","en-TK","en-TO","en-TT","en-TV","en-TZ","en-UA","en-UG","en-UM","en-VC","en-VG","en-VI","en-VU","en-WS","en-ZA","en-ZM","en-ZW","eo","es","es-419","es-AR","es-BO","es-BR","es-BZ","es-CL","es-CO","es-CR","es-CU","es-DO","es-EA","es-EC","es-GQ","es-GT","es-HN","es-IC","es-MX","es-NI","es-PA","es-PE","es-PH","es-PR","es-PY","es-SV","es-US","es-UY","es-VE","et","eu","ewo","fa","fa-AF","ff","ff-Adlm","ff-Adlm-BF","ff-Adlm-CM","ff-Adlm-GH","ff-Adlm-GM","ff-Adlm-GW","ff-Adlm-LR","ff-Adlm-MR","ff-Adlm-NE","ff-Adlm-NG","ff-Adlm-SL","ff-Adlm-SN","ff-Latn","ff-Latn-BF","ff-Latn-CM","ff-Latn-GH","ff-Latn-GM","ff-Latn-GN","ff-Latn-GW","ff-Latn-LR","ff-Latn-MR","ff-Latn-NE","ff-Latn-NG","ff-Latn-SL","fi","fil","fo","fo-DK","fr","fr-BE","fr-BF","fr-BI","fr-BJ","fr-BL","fr-CA","fr-CD","fr-CF","fr-CG","fr-CH","fr-CI","fr-CM","fr-DJ","fr-DZ","fr-GA","fr-GF","fr-GN","fr-GP","fr-GQ","fr-HT","fr-KM","fr-LU","fr-MA","fr-MC","fr-MF","fr-MG","fr-ML","fr-MQ","fr-MR","fr-MU","fr-NC","fr-NE","fr-PF","fr-PM","fr-RE","fr-RW","fr-SC","fr-SN","fr-SY","fr-TD","fr-TG","fr-TN","fr-VU","fr-WF","fr-YT","frr","fur","fy","ga","ga-GB","gaa","gd","gez","gez-ER","gl","gn","gsw","gsw-FR","gsw-LI","gu","guz","gv","ha","ha-Arab","ha-Arab-SD","ha-GH","ha-NE","haw","he","hi","hi-Latn","hnj","hnj-Hmnp","hr","hr-BA","hsb","ht","hu","hy","ia","id","ie","ig","ii","io","is","it","it-CH","it-SM","it-VA","iu","iu-Latn","ja","jbo","jgo","jmc","jv","ka","kaa","kaa-Cyrl","kaa-Latn","kab","kaj","kam","kcg","kde","kea","kek","ken","kgp","khq","ki","kk","kk-Arab","kk-Cyrl","kk-KZ","kkj","kl","kln","km","kn","ko","ko-CN","ko-KP","kok","kok-Deva","kok-Latn","kpe","kpe-GN","ks","ks-Arab","ks-Deva","ksb","ksf","ksh","ku","ku-Arab","ku-Arab-IR","ku-Latn","ku-Latn-IQ","ku-Latn-SY","ku-TR","kw","kxv","kxv-Deva","kxv-Latn","kxv-Orya","kxv-Telu","ky","la","lag","lb","lg","lij","lkt","lld","lmo","ln","ln-AO","ln-CF","ln-CG","lo","lrc","lrc-IQ","lt","ltg","lu","luo","luy","lv","lzz","mai","mas","mas-TZ","mdf","mer","mfe","mg","mgh","mgo","mhn","mi","mic","mk","ml","mn","mn-Mong","mn-Mong-MN","mni","mni-Beng","mni-Mtei","moh","mr","ms","ms-Arab","ms-Arab-BN","ms-BN","ms-ID","ms-SG","mt","mua","mus","mww","mww-Hmnp","my","myv","mzn","naq","nb","nb-SJ","nd","nds","nds-NL","ne","ne-IN","nl","nl-AW","nl-BE","nl-BQ","nl-CW","nl-SR","nl-SX","nmg","nn","nnh","no","nqo","nr","nso","nus","nv","ny","nyn","oc","oc-ES","oka","oka-US","om","om-KE","or","os","os-RU","osa","pa","pa-Arab","pa-Guru","pap","pap-AW","pcm","pi","pi-Latn","pis","pl","pms","prg","ps","ps-PK","pt","pt-AO","pt-CH","pt-CV","pt-GQ","pt-GW","pt-LU","pt-MO","pt-MZ","pt-PT","pt-ST","pt-TL","qu","qu-BO","qu-EC","quc","raj","rhg","rhg-Rohg","rhg-Rohg-BD","rif","rm","rn","ro","ro-MD","rof","ru","ru-BY","ru-KG","ru-KZ","ru-MD","ru-UA","rw","rwk","sa","sah","saq","sat","sat-Deva","sat-Olck","sbp","sc","scn","sd","sd-Arab","sd-Deva","sdh","sdh-IQ","se","se-FI","se-SE","seh","ses","sg","sgs","shi","shi-Latn","shi-Tfng","shn","shn-TH","si","sid","sk","skr","sl","sma","sma-NO","smj","smj-NO","smn","sms","sn","so","so-DJ","so-ET","so-KE","sq","sq-MK","sq-XK","sr","sr-Cyrl","sr-Cyrl-BA","sr-Cyrl-ME","sr-Cyrl-XK","sr-Latn","sr-Latn-BA","sr-Latn-ME","sr-Latn-XK","ss","ss-SZ","ssy","st","st-LS","su","su-Latn","suz","suz-Deva","suz-Sunu","sv","sv-AX","sv-FI","sw","sw-CD","sw-KE","sw-UG","syr","syr-SY","szl","ta","ta-LK","ta-MY","ta-SG","te","teo","teo-KE","tg","th","ti","ti-ER","tig","tk","tn","tn-BW","to","tok","tpi","tr","tr-CY","trv","trw","ts","tt","twq","tyv","tzm","ug","uk","und","ur","ur-IN","uz","uz-Arab","uz-Cyrl","uz-Latn","vai","vai-Latn","vai-Vaii","ve","vec","vi","vmw","vo","vun","wa","wae","wal","wbp","wo","xh","xnr","xog","yav","yi","yo","yo-BJ","yrl","yrl-CO","yrl-VE","yue","yue-Hans","yue-Hant","yue-Hant-CN","yue-Hant-MO","za","zgh","zh","zh-Hans","zh-Hans-HK","zh-Hans-MO","zh-Hans-MY","zh-Hans-SG","zh-Hant","zh-Hant-HK","zh-Hant-MO","zh-Hant-MY","zh-Latn","zu"];function n(e="en"){if(!("DateTimeFormat"in Intl)||!("formatToParts"in Intl.DateTimeFormat.prototype)||!("formatRange"in Intl.DateTimeFormat.prototype)||function(){try{return"dayPeriod"!==new Intl.DateTimeFormat("en",{hourCycle:"h11",hour:"numeric"}).formatToParts(0)[2].type}catch{return!1}}()||function(){try{return!!new Intl.DateTimeFormat("en",{dateStyle:"short",hour:"numeric"}).format(new Date(0))}catch{return!1}}()||!function(){try{return!!new Intl.DateTimeFormat(void 0,{dateStyle:"short"}).resolvedOptions().dateStyle}catch{return!1}}()||!function(e){if(!e)return!0;const t=Array.isArray(e)?e:[e];return Intl.DateTimeFormat.supportedLocalesOf(t).length===t.length}(e))return e?(0,a.YW)([e],s,"en"):void 0}},3e3(e,t,r){r.d(t,{Z:()=>i});var a=r(2905);const s=["aa","aa-DJ","aa-ER","ab","af","af-NA","agq","ak","am","an","ann","apc","ar","ar-AE","ar-BH","ar-DJ","ar-DZ","ar-EG","ar-EH","ar-ER","ar-IL","ar-IQ","ar-JO","ar-KM","ar-KW","ar-LB","ar-LY","ar-MA","ar-MR","ar-OM","ar-PS","ar-QA","ar-SA","ar-SD","ar-SO","ar-SS","ar-SY","ar-TD","ar-TN","ar-YE","arn","as","asa","ast","az","az-Arab","az-Arab-IQ","az-Arab-TR","az-Cyrl","az-Latn","ba","bal","bal-Arab","bal-Latn","bas","be","be-tarask","bem","bew","bez","bg","bgc","bgn","bgn-AE","bgn-AF","bgn-IR","bgn-OM","bho","blo","blt","bm","bm-Nkoo","bn","bn-IN","bo","bo-IN","bqi","br","brx","bs","bs-Cyrl","bs-Latn","bss","bua","byn","ca","ca-AD","ca-ES-valencia","ca-FR","ca-IT","cad","cch","ccp","ccp-IN","ce","ceb","cgg","cho","chr","cic","ckb","ckb-IR","co","cop","cs","csw","cu","cv","cy","da","da-GL","dav","de","de-AT","de-BE","de-CH","de-IT","de-LI","de-LU","dje","doi","dsb","dua","dv","dyo","dz","ebu","ee","ee-TG","el","el-CY","el-polyton","en","en-001","en-150","en-AE","en-AG","en-AI","en-AS","en-AT","en-AU","en-BB","en-BE","en-BI","en-BM","en-BS","en-BW","en-BZ","en-CA","en-CC","en-CH","en-CK","en-CM","en-CX","en-CY","en-CZ","en-DE","en-DG","en-DK","en-DM","en-Dsrt","en-EE","en-ER","en-ES","en-FI","en-FJ","en-FK","en-FM","en-FR","en-GB","en-GD","en-GE","en-GG","en-GH","en-GI","en-GM","en-GS","en-GU","en-GY","en-HK","en-HU","en-ID","en-IE","en-IL","en-IM","en-IN","en-IO","en-IT","en-JE","en-JM","en-JP","en-KE","en-KI","en-KN","en-KY","en-LC","en-LR","en-LS","en-LT","en-LV","en-MG","en-MH","en-MO","en-MP","en-MS","en-MT","en-MU","en-MV","en-MW","en-MY","en-NA","en-NF","en-NG","en-NL","en-NO","en-NR","en-NU","en-NZ","en-PG","en-PH","en-PK","en-PL","en-PN","en-PR","en-PT","en-PW","en-RO","en-RW","en-SB","en-SC","en-SD","en-SE","en-SG","en-SH","en-SI","en-SK","en-SL","en-SS","en-SX","en-SZ","en-Shaw","en-TC","en-TK","en-TO","en-TT","en-TV","en-TZ","en-UA","en-UG","en-UM","en-VC","en-VG","en-VI","en-VU","en-WS","en-ZA","en-ZM","en-ZW","eo","es","es-419","es-AR","es-BO","es-BR","es-BZ","es-CL","es-CO","es-CR","es-CU","es-DO","es-EA","es-EC","es-GQ","es-GT","es-HN","es-IC","es-MX","es-NI","es-PA","es-PE","es-PH","es-PR","es-PY","es-SV","es-US","es-UY","es-VE","et","eu","ewo","fa","fa-AF","ff","ff-Adlm","ff-Adlm-BF","ff-Adlm-CM","ff-Adlm-GH","ff-Adlm-GM","ff-Adlm-GW","ff-Adlm-LR","ff-Adlm-MR","ff-Adlm-NE","ff-Adlm-NG","ff-Adlm-SL","ff-Adlm-SN","ff-Latn","ff-Latn-BF","ff-Latn-CM","ff-Latn-GH","ff-Latn-GM","ff-Latn-GN","ff-Latn-GW","ff-Latn-LR","ff-Latn-MR","ff-Latn-NE","ff-Latn-NG","ff-Latn-SL","fi","fil","fo","fo-DK","fr","fr-BE","fr-BF","fr-BI","fr-BJ","fr-BL","fr-CA","fr-CD","fr-CF","fr-CG","fr-CH","fr-CI","fr-CM","fr-DJ","fr-DZ","fr-GA","fr-GF","fr-GN","fr-GP","fr-GQ","fr-HT","fr-KM","fr-LU","fr-MA","fr-MC","fr-MF","fr-MG","fr-ML","fr-MQ","fr-MR","fr-MU","fr-NC","fr-NE","fr-PF","fr-PM","fr-RE","fr-RW","fr-SC","fr-SN","fr-SY","fr-TD","fr-TG","fr-TN","fr-VU","fr-WF","fr-YT","frr","fur","fy","ga","ga-GB","gaa","gd","gez","gez-ER","gl","gn","gsw","gsw-FR","gsw-LI","gu","guz","gv","ha","ha-Arab","ha-Arab-SD","ha-GH","ha-NE","haw","he","hi","hi-Latn","hnj","hnj-Hmnp","hr","hr-BA","hsb","ht","hu","hy","ia","id","ie","ig","ii","io","is","it","it-CH","it-SM","it-VA","iu","iu-Latn","ja","jbo","jgo","jmc","jv","ka","kaa","kaa-Cyrl","kaa-Latn","kab","kaj","kam","kcg","kde","kea","kek","ken","kgp","khq","ki","kk","kk-Arab","kk-Cyrl","kk-KZ","kkj","kl","kln","km","kn","ko","ko-CN","ko-KP","kok","kok-Deva","kok-Latn","kpe","kpe-GN","ks","ks-Arab","ks-Deva","ksb","ksf","ksh","ku","ku-Arab","ku-Arab-IR","ku-Latn","ku-Latn-IQ","ku-Latn-SY","ku-TR","kw","kxv","kxv-Deva","kxv-Latn","kxv-Orya","kxv-Telu","ky","la","lag","lb","lg","lij","lkt","lld","lmo","ln","ln-AO","ln-CF","ln-CG","lo","lrc","lrc-IQ","lt","ltg","lu","luo","luy","lv","lzz","mai","mas","mas-TZ","mdf","mer","mfe","mg","mgh","mgo","mhn","mi","mic","mk","ml","mn","mn-Mong","mn-Mong-MN","mni","mni-Beng","mni-Mtei","moh","mr","ms","ms-Arab","ms-Arab-BN","ms-BN","ms-ID","ms-SG","mt","mua","mus","mww","mww-Hmnp","my","myv","mzn","naq","nb","nb-SJ","nd","nds","nds-NL","ne","ne-IN","nl","nl-AW","nl-BE","nl-BQ","nl-CW","nl-SR","nl-SX","nmg","nn","nnh","no","nqo","nr","nso","nus","nv","ny","nyn","oc","oc-ES","oka","oka-US","om","om-KE","or","os","os-RU","osa","pa","pa-Arab","pa-Guru","pap","pap-AW","pcm","pi","pi-Latn","pis","pl","pms","prg","ps","ps-PK","pt","pt-AO","pt-CH","pt-CV","pt-GQ","pt-GW","pt-LU","pt-MO","pt-MZ","pt-PT","pt-ST","pt-TL","qu","qu-BO","qu-EC","quc","raj","rhg","rhg-Rohg","rhg-Rohg-BD","rif","rm","rn","ro","ro-MD","rof","ru","ru-BY","ru-KG","ru-KZ","ru-MD","ru-UA","rw","rwk","sa","sah","saq","sat","sat-Deva","sat-Olck","sbp","sc","scn","sd","sd-Arab","sd-Deva","sdh","sdh-IQ","se","se-FI","se-SE","seh","ses","sg","sgs","shi","shi-Latn","shi-Tfng","shn","shn-TH","si","sid","sk","skr","sl","sma","sma-NO","smj","smj-NO","smn","sms","sn","so","so-DJ","so-ET","so-KE","sq","sq-MK","sq-XK","sr","sr-Cyrl","sr-Cyrl-BA","sr-Cyrl-ME","sr-Cyrl-XK","sr-Latn","sr-Latn-BA","sr-Latn-ME","sr-Latn-XK","ss","ss-SZ","ssy","st","st-LS","su","su-Latn","suz","suz-Deva","suz-Sunu","sv","sv-AX","sv-FI","sw","sw-CD","sw-KE","sw-UG","syr","syr-SY","szl","ta","ta-LK","ta-MY","ta-SG","te","teo","teo-KE","tg","th","ti","ti-ER","tig","tk","tn","tn-BW","to","tok","tpi","tr","tr-CY","trv","trw","ts","tt","twq","tyv","tzm","ug","uk","und","ur","ur-IN","uz","uz-Arab","uz-Cyrl","uz-Latn","vai","vai-Latn","vai-Vaii","ve","vec","vi","vmw","vo","vun","wa","wae","wal","wbp","wo","xh","xnr","xog","yav","yi","yo","yo-BJ","yrl","yrl-CO","yrl-VE","yue","yue-Hans","yue-Hant","yue-Hant-CN","yue-Hant-MO","za","zgh","zh","zh-Hans","zh-Hans-HK","zh-Hans-MO","zh-Hans-MY","zh-Hans-SG","zh-Hant","zh-Hant-HK","zh-Hant-MO","zh-Hant-MY","zh-Latn","zu"];function n(){return!Intl.DisplayNames||function(){const e=Intl.DisplayNames;return!(!e||e.polyfilled)&&"CA"===new e(["en"],{type:"region"}).of("CA")}()||function(){const e=Intl.DisplayNames;return!(!e||e.polyfilled)&&"Arabic"!==new e(["en"],{type:"script"}).of("arab")}()}function i(e="en"){try{if(n()||!function(e){if(!e)return!0;const t=Array.isArray(e)?e:[e];return Intl.DisplayNames.supportedLocalesOf(t).length===t.length}(e))return(0,a.YW)([e],s,"en")}catch{return!0}}},9409(e,t,r){function a(){return"undefined"==typeof Intl||!("DurationFormat"in Intl)}r.d(t,{Z:()=>a})},8637(e,t,r){function a(){return"undefined"==typeof Intl||!("getCanonicalLocales"in Intl)||"x-private"===Intl.getCanonicalLocales("und-x-private")[0]}r.d(t,{Z:()=>a})},2733(e,t,r){r.d(t,{Z:()=>n});var a=r(2905);const s=["aa","aa-DJ","aa-ER","ab","af","af-NA","agq","ak","am","an","ann","apc","ar","ar-AE","ar-BH","ar-DJ","ar-DZ","ar-EG","ar-EH","ar-ER","ar-IL","ar-IQ","ar-JO","ar-KM","ar-KW","ar-LB","ar-LY","ar-MA","ar-MR","ar-OM","ar-PS","ar-QA","ar-SA","ar-SD","ar-SO","ar-SS","ar-SY","ar-TD","ar-TN","ar-YE","arn","as","asa","ast","az","az-Arab","az-Arab-IQ","az-Arab-TR","az-Cyrl","az-Latn","ba","bal","bal-Arab","bal-Latn","bas","be","be-tarask","bem","bew","bez","bg","bgc","bgn","bgn-AE","bgn-AF","bgn-IR","bgn-OM","bho","blo","blt","bm","bm-Nkoo","bn","bn-IN","bo","bo-IN","bqi","br","brx","bs","bs-Cyrl","bs-Latn","bss","bua","byn","ca","ca-AD","ca-ES-valencia","ca-FR","ca-IT","cad","cch","ccp","ccp-IN","ce","ceb","cgg","cho","chr","cic","ckb","ckb-IR","co","cop","cs","csw","cu","cv","cy","da","da-GL","dav","de","de-AT","de-BE","de-CH","de-IT","de-LI","de-LU","dje","doi","dsb","dua","dv","dyo","dz","ebu","ee","ee-TG","el","el-CY","el-polyton","en","en-001","en-150","en-AE","en-AG","en-AI","en-AS","en-AT","en-AU","en-BB","en-BE","en-BI","en-BM","en-BS","en-BW","en-BZ","en-CA","en-CC","en-CH","en-CK","en-CM","en-CX","en-CY","en-CZ","en-DE","en-DG","en-DK","en-DM","en-Dsrt","en-EE","en-ER","en-ES","en-FI","en-FJ","en-FK","en-FM","en-FR","en-GB","en-GD","en-GE","en-GG","en-GH","en-GI","en-GM","en-GS","en-GU","en-GY","en-HK","en-HU","en-ID","en-IE","en-IL","en-IM","en-IN","en-IO","en-IT","en-JE","en-JM","en-JP","en-KE","en-KI","en-KN","en-KY","en-LC","en-LR","en-LS","en-LT","en-LV","en-MG","en-MH","en-MO","en-MP","en-MS","en-MT","en-MU","en-MV","en-MW","en-MY","en-NA","en-NF","en-NG","en-NL","en-NO","en-NR","en-NU","en-NZ","en-PG","en-PH","en-PK","en-PL","en-PN","en-PR","en-PT","en-PW","en-RO","en-RW","en-SB","en-SC","en-SD","en-SE","en-SG","en-SH","en-SI","en-SK","en-SL","en-SS","en-SX","en-SZ","en-Shaw","en-TC","en-TK","en-TO","en-TT","en-TV","en-TZ","en-UA","en-UG","en-UM","en-VC","en-VG","en-VI","en-VU","en-WS","en-ZA","en-ZM","en-ZW","eo","es","es-419","es-AR","es-BO","es-BR","es-BZ","es-CL","es-CO","es-CR","es-CU","es-DO","es-EA","es-EC","es-GQ","es-GT","es-HN","es-IC","es-MX","es-NI","es-PA","es-PE","es-PH","es-PR","es-PY","es-SV","es-US","es-UY","es-VE","et","eu","ewo","fa","fa-AF","ff","ff-Adlm","ff-Adlm-BF","ff-Adlm-CM","ff-Adlm-GH","ff-Adlm-GM","ff-Adlm-GW","ff-Adlm-LR","ff-Adlm-MR","ff-Adlm-NE","ff-Adlm-NG","ff-Adlm-SL","ff-Adlm-SN","ff-Latn","ff-Latn-BF","ff-Latn-CM","ff-Latn-GH","ff-Latn-GM","ff-Latn-GN","ff-Latn-GW","ff-Latn-LR","ff-Latn-MR","ff-Latn-NE","ff-Latn-NG","ff-Latn-SL","fi","fil","fo","fo-DK","fr","fr-BE","fr-BF","fr-BI","fr-BJ","fr-BL","fr-CA","fr-CD","fr-CF","fr-CG","fr-CH","fr-CI","fr-CM","fr-DJ","fr-DZ","fr-GA","fr-GF","fr-GN","fr-GP","fr-GQ","fr-HT","fr-KM","fr-LU","fr-MA","fr-MC","fr-MF","fr-MG","fr-ML","fr-MQ","fr-MR","fr-MU","fr-NC","fr-NE","fr-PF","fr-PM","fr-RE","fr-RW","fr-SC","fr-SN","fr-SY","fr-TD","fr-TG","fr-TN","fr-VU","fr-WF","fr-YT","frr","fur","fy","ga","ga-GB","gaa","gd","gez","gez-ER","gl","gn","gsw","gsw-FR","gsw-LI","gu","guz","gv","ha","ha-Arab","ha-Arab-SD","ha-GH","ha-NE","haw","he","hi","hi-Latn","hnj","hnj-Hmnp","hr","hr-BA","hsb","ht","hu","hy","ia","id","ie","ig","ii","io","is","it","it-CH","it-SM","it-VA","iu","iu-Latn","ja","jbo","jgo","jmc","jv","ka","kaa","kaa-Cyrl","kaa-Latn","kab","kaj","kam","kcg","kde","kea","kek","ken","kgp","khq","ki","kk","kk-Arab","kk-Cyrl","kk-KZ","kkj","kl","kln","km","kn","ko","ko-CN","ko-KP","kok","kok-Deva","kok-Latn","kpe","kpe-GN","ks","ks-Arab","ks-Deva","ksb","ksf","ksh","ku","ku-Arab","ku-Arab-IR","ku-Latn","ku-Latn-IQ","ku-Latn-SY","ku-TR","kw","kxv","kxv-Deva","kxv-Latn","kxv-Orya","kxv-Telu","ky","la","lag","lb","lg","lij","lkt","lld","lmo","ln","ln-AO","ln-CF","ln-CG","lo","lrc","lrc-IQ","lt","ltg","lu","luo","luy","lv","lzz","mai","mas","mas-TZ","mdf","mer","mfe","mg","mgh","mgo","mhn","mi","mic","mk","ml","mn","mn-Mong","mn-Mong-MN","mni","mni-Beng","mni-Mtei","moh","mr","ms","ms-Arab","ms-Arab-BN","ms-BN","ms-ID","ms-SG","mt","mua","mus","mww","mww-Hmnp","my","myv","mzn","naq","nb","nb-SJ","nd","nds","nds-NL","ne","ne-IN","nl","nl-AW","nl-BE","nl-BQ","nl-CW","nl-SR","nl-SX","nmg","nn","nnh","no","nqo","nr","nso","nus","nv","ny","nyn","oc","oc-ES","oka","oka-US","om","om-KE","or","os","os-RU","osa","pa","pa-Arab","pa-Guru","pap","pap-AW","pcm","pi","pi-Latn","pis","pl","pms","prg","ps","ps-PK","pt","pt-AO","pt-CH","pt-CV","pt-GQ","pt-GW","pt-LU","pt-MO","pt-MZ","pt-PT","pt-ST","pt-TL","qu","qu-BO","qu-EC","quc","raj","rhg","rhg-Rohg","rhg-Rohg-BD","rif","rm","rn","ro","ro-MD","rof","ru","ru-BY","ru-KG","ru-KZ","ru-MD","ru-UA","rw","rwk","sa","sah","saq","sat","sat-Deva","sat-Olck","sbp","sc","scn","sd","sd-Arab","sd-Deva","sdh","sdh-IQ","se","se-FI","se-SE","seh","ses","sg","sgs","shi","shi-Latn","shi-Tfng","shn","shn-TH","si","sid","sk","skr","sl","sma","sma-NO","smj","smj-NO","smn","sms","sn","so","so-DJ","so-ET","so-KE","sq","sq-MK","sq-XK","sr","sr-Cyrl","sr-Cyrl-BA","sr-Cyrl-ME","sr-Cyrl-XK","sr-Latn","sr-Latn-BA","sr-Latn-ME","sr-Latn-XK","ss","ss-SZ","ssy","st","st-LS","su","su-Latn","suz","suz-Deva","suz-Sunu","sv","sv-AX","sv-FI","sw","sw-CD","sw-KE","sw-UG","syr","syr-SY","szl","ta","ta-LK","ta-MY","ta-SG","te","teo","teo-KE","tg","th","ti","ti-ER","tig","tk","tn","tn-BW","to","tok","tpi","tr","tr-CY","trv","trw","ts","tt","twq","tyv","tzm","ug","uk","und","ur","ur-IN","uz","uz-Arab","uz-Cyrl","uz-Latn","vai","vai-Latn","vai-Vaii","ve","vec","vi","vmw","vo","vun","wa","wae","wal","wbp","wo","xh","xnr","xog","yav","yi","yo","yo-BJ","yrl","yrl-CO","yrl-VE","yue","yue-Hans","yue-Hant","yue-Hant-CN","yue-Hant-MO","za","zgh","zh","zh-Hans","zh-Hans-HK","zh-Hans-MO","zh-Hans-MY","zh-Hans-SG","zh-Hant","zh-Hant-HK","zh-Hant-MO","zh-Hant-MY","zh-Latn","zu"];function n(e="en"){if(!("ListFormat"in Intl)||!function(e){if(!e)return!0;const t=Array.isArray(e)?e:[e];return Intl.ListFormat.supportedLocalesOf(t).length===t.length}(e))return e?(0,a.YW)([e],s,"en"):void 0}},2932(e,t,r){function a(){return!("Locale"in Intl)||function(){try{return"x-private"===new Intl.Locale("und-x-private").toString()}catch{return!0}}()||function(){try{const e=new Intl.Locale("en-US");return"function"!=typeof e.getWeekInfo||"function"!=typeof e.getCalendars||"function"!=typeof e.getCollations||"function"!=typeof e.getHourCycles||"function"!=typeof e.getNumberingSystems||"function"!=typeof e.getTimeZones||"function"!=typeof e.getTextInfo}catch{return!0}}()||!function(){try{const e=new Intl.Locale("en-US-posix"),t=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(e),"variants");return void 0!==t&&"function"==typeof t.get}catch{return!1}}()}r.d(t,{Z:()=>a})},2905(e,t,r){r.d(t,{Bg:()=>w,YW:()=>x,s8:()=>C});r(8111),r(116),r(7588),r(1701),r(8237),r(7642),r(5024),r(1698),r(805),r(3525);var a=r(1480);const s={supplemental:{languageMatching:{"written-new":[{paradigmLocales:{_locales:"en en_GB es es_419 pt_BR pt_PT"}},{$enUS:{_value:"AS+CA+GU+MH+MP+PH+PR+UM+US+VI"}},{$cnsar:{_value:"HK+MO"}},{$americas:{_value:"019"}},{$maghreb:{_value:"MA+DZ+TN+LY+MR+EH"}},{no:{_desired:"nb",_distance:"1"}},{bs:{_desired:"hr",_distance:"4"}},{bs:{_desired:"sh",_distance:"4"}},{hr:{_desired:"sh",_distance:"4"}},{sr:{_desired:"sh",_distance:"4"}},{aa:{_desired:"ssy",_distance:"4"}},{de:{_desired:"gsw",_distance:"4",_oneway:"true"}},{de:{_desired:"lb",_distance:"4",_oneway:"true"}},{no:{_desired:"da",_distance:"8"}},{nb:{_desired:"da",_distance:"8"}},{ru:{_desired:"ab",_distance:"30",_oneway:"true"}},{en:{_desired:"ach",_distance:"30",_oneway:"true"}},{nl:{_desired:"af",_distance:"20",_oneway:"true"}},{en:{_desired:"ak",_distance:"30",_oneway:"true"}},{en:{_desired:"am",_distance:"30",_oneway:"true"}},{es:{_desired:"ay",_distance:"20",_oneway:"true"}},{ru:{_desired:"az",_distance:"30",_oneway:"true"}},{ur:{_desired:"bal",_distance:"20",_oneway:"true"}},{ru:{_desired:"be",_distance:"20",_oneway:"true"}},{en:{_desired:"bem",_distance:"30",_oneway:"true"}},{hi:{_desired:"bh",_distance:"30",_oneway:"true"}},{en:{_desired:"bn",_distance:"30",_oneway:"true"}},{zh:{_desired:"bo",_distance:"20",_oneway:"true"}},{fr:{_desired:"br",_distance:"20",_oneway:"true"}},{es:{_desired:"ca",_distance:"20",_oneway:"true"}},{fil:{_desired:"ceb",_distance:"30",_oneway:"true"}},{en:{_desired:"chr",_distance:"20",_oneway:"true"}},{ar:{_desired:"ckb",_distance:"30",_oneway:"true"}},{fr:{_desired:"co",_distance:"20",_oneway:"true"}},{fr:{_desired:"crs",_distance:"20",_oneway:"true"}},{sk:{_desired:"cs",_distance:"20"}},{en:{_desired:"cy",_distance:"20",_oneway:"true"}},{en:{_desired:"ee",_distance:"30",_oneway:"true"}},{en:{_desired:"eo",_distance:"30",_oneway:"true"}},{es:{_desired:"eu",_distance:"20",_oneway:"true"}},{da:{_desired:"fo",_distance:"20",_oneway:"true"}},{nl:{_desired:"fy",_distance:"20",_oneway:"true"}},{en:{_desired:"ga",_distance:"20",_oneway:"true"}},{en:{_desired:"gaa",_distance:"30",_oneway:"true"}},{en:{_desired:"gd",_distance:"20",_oneway:"true"}},{es:{_desired:"gl",_distance:"20",_oneway:"true"}},{es:{_desired:"gn",_distance:"20",_oneway:"true"}},{hi:{_desired:"gu",_distance:"30",_oneway:"true"}},{en:{_desired:"ha",_distance:"30",_oneway:"true"}},{en:{_desired:"haw",_distance:"20",_oneway:"true"}},{fr:{_desired:"ht",_distance:"20",_oneway:"true"}},{ru:{_desired:"hy",_distance:"30",_oneway:"true"}},{en:{_desired:"ia",_distance:"30",_oneway:"true"}},{en:{_desired:"ig",_distance:"30",_oneway:"true"}},{en:{_desired:"is",_distance:"20",_oneway:"true"}},{id:{_desired:"jv",_distance:"20",_oneway:"true"}},{en:{_desired:"ka",_distance:"30",_oneway:"true"}},{fr:{_desired:"kg",_distance:"30",_oneway:"true"}},{ru:{_desired:"kk",_distance:"30",_oneway:"true"}},{en:{_desired:"km",_distance:"30",_oneway:"true"}},{en:{_desired:"kn",_distance:"30",_oneway:"true"}},{en:{_desired:"kri",_distance:"30",_oneway:"true"}},{tr:{_desired:"ku",_distance:"30",_oneway:"true"}},{ru:{_desired:"ky",_distance:"30",_oneway:"true"}},{it:{_desired:"la",_distance:"20",_oneway:"true"}},{en:{_desired:"lg",_distance:"30",_oneway:"true"}},{fr:{_desired:"ln",_distance:"30",_oneway:"true"}},{en:{_desired:"lo",_distance:"30",_oneway:"true"}},{en:{_desired:"loz",_distance:"30",_oneway:"true"}},{fr:{_desired:"lua",_distance:"30",_oneway:"true"}},{hi:{_desired:"mai",_distance:"20",_oneway:"true"}},{en:{_desired:"mfe",_distance:"30",_oneway:"true"}},{fr:{_desired:"mg",_distance:"30",_oneway:"true"}},{en:{_desired:"mi",_distance:"20",_oneway:"true"}},{en:{_desired:"ml",_distance:"30",_oneway:"true"}},{ru:{_desired:"mn",_distance:"30",_oneway:"true"}},{hi:{_desired:"mr",_distance:"30",_oneway:"true"}},{id:{_desired:"ms",_distance:"30",_oneway:"true"}},{en:{_desired:"mt",_distance:"30",_oneway:"true"}},{en:{_desired:"my",_distance:"30",_oneway:"true"}},{en:{_desired:"ne",_distance:"30",_oneway:"true"}},{nb:{_desired:"nn",_distance:"20"}},{no:{_desired:"nn",_distance:"20"}},{en:{_desired:"nso",_distance:"30",_oneway:"true"}},{en:{_desired:"ny",_distance:"30",_oneway:"true"}},{en:{_desired:"nyn",_distance:"30",_oneway:"true"}},{fr:{_desired:"oc",_distance:"20",_oneway:"true"}},{en:{_desired:"om",_distance:"30",_oneway:"true"}},{en:{_desired:"or",_distance:"30",_oneway:"true"}},{en:{_desired:"pa",_distance:"30",_oneway:"true"}},{en:{_desired:"pcm",_distance:"20",_oneway:"true"}},{en:{_desired:"ps",_distance:"30",_oneway:"true"}},{es:{_desired:"qu",_distance:"30",_oneway:"true"}},{de:{_desired:"rm",_distance:"20",_oneway:"true"}},{en:{_desired:"rn",_distance:"30",_oneway:"true"}},{fr:{_desired:"rw",_distance:"30",_oneway:"true"}},{hi:{_desired:"sa",_distance:"30",_oneway:"true"}},{en:{_desired:"sd",_distance:"30",_oneway:"true"}},{en:{_desired:"si",_distance:"30",_oneway:"true"}},{en:{_desired:"sn",_distance:"30",_oneway:"true"}},{en:{_desired:"so",_distance:"30",_oneway:"true"}},{en:{_desired:"sq",_distance:"30",_oneway:"true"}},{en:{_desired:"st",_distance:"30",_oneway:"true"}},{id:{_desired:"su",_distance:"20",_oneway:"true"}},{en:{_desired:"sw",_distance:"30",_oneway:"true"}},{en:{_desired:"ta",_distance:"30",_oneway:"true"}},{en:{_desired:"te",_distance:"30",_oneway:"true"}},{ru:{_desired:"tg",_distance:"30",_oneway:"true"}},{en:{_desired:"ti",_distance:"30",_oneway:"true"}},{ru:{_desired:"tk",_distance:"30",_oneway:"true"}},{en:{_desired:"tlh",_distance:"30",_oneway:"true"}},{en:{_desired:"tn",_distance:"30",_oneway:"true"}},{en:{_desired:"to",_distance:"30",_oneway:"true"}},{ru:{_desired:"tt",_distance:"30",_oneway:"true"}},{en:{_desired:"tum",_distance:"30",_oneway:"true"}},{zh:{_desired:"ug",_distance:"20",_oneway:"true"}},{ru:{_desired:"uk",_distance:"20",_oneway:"true"}},{en:{_desired:"ur",_distance:"30",_oneway:"true"}},{ru:{_desired:"uz",_distance:"30",_oneway:"true"}},{fr:{_desired:"wo",_distance:"30",_oneway:"true"}},{en:{_desired:"xh",_distance:"30",_oneway:"true"}},{en:{_desired:"yi",_distance:"30",_oneway:"true"}},{en:{_desired:"yo",_distance:"30",_oneway:"true"}},{zh:{_desired:"za",_distance:"20",_oneway:"true"}},{en:{_desired:"zu",_distance:"30",_oneway:"true"}},{ar:{_desired:"aao",_distance:"10",_oneway:"true"}},{ar:{_desired:"abh",_distance:"10",_oneway:"true"}},{ar:{_desired:"abv",_distance:"10",_oneway:"true"}},{ar:{_desired:"acm",_distance:"10",_oneway:"true"}},{ar:{_desired:"acq",_distance:"10",_oneway:"true"}},{ar:{_desired:"acw",_distance:"10",_oneway:"true"}},{ar:{_desired:"acx",_distance:"10",_oneway:"true"}},{ar:{_desired:"acy",_distance:"10",_oneway:"true"}},{ar:{_desired:"adf",_distance:"10",_oneway:"true"}},{ar:{_desired:"aeb",_distance:"10",_oneway:"true"}},{ar:{_desired:"aec",_distance:"10",_oneway:"true"}},{ar:{_desired:"afb",_distance:"10",_oneway:"true"}},{ar:{_desired:"ajp",_distance:"10",_oneway:"true"}},{ar:{_desired:"apc",_distance:"10",_oneway:"true"}},{ar:{_desired:"apd",_distance:"10",_oneway:"true"}},{ar:{_desired:"arq",_distance:"10",_oneway:"true"}},{ar:{_desired:"ars",_distance:"10",_oneway:"true"}},{ar:{_desired:"ary",_distance:"10",_oneway:"true"}},{ar:{_desired:"arz",_distance:"10",_oneway:"true"}},{ar:{_desired:"auz",_distance:"10",_oneway:"true"}},{ar:{_desired:"avl",_distance:"10",_oneway:"true"}},{ar:{_desired:"ayh",_distance:"10",_oneway:"true"}},{ar:{_desired:"ayl",_distance:"10",_oneway:"true"}},{ar:{_desired:"ayn",_distance:"10",_oneway:"true"}},{ar:{_desired:"ayp",_distance:"10",_oneway:"true"}},{ar:{_desired:"bbz",_distance:"10",_oneway:"true"}},{ar:{_desired:"pga",_distance:"10",_oneway:"true"}},{ar:{_desired:"shu",_distance:"10",_oneway:"true"}},{ar:{_desired:"ssh",_distance:"10",_oneway:"true"}},{az:{_desired:"azb",_distance:"10",_oneway:"true"}},{et:{_desired:"vro",_distance:"10",_oneway:"true"}},{ff:{_desired:"ffm",_distance:"10",_oneway:"true"}},{ff:{_desired:"fub",_distance:"10",_oneway:"true"}},{ff:{_desired:"fue",_distance:"10",_oneway:"true"}},{ff:{_desired:"fuf",_distance:"10",_oneway:"true"}},{ff:{_desired:"fuh",_distance:"10",_oneway:"true"}},{ff:{_desired:"fui",_distance:"10",_oneway:"true"}},{ff:{_desired:"fuq",_distance:"10",_oneway:"true"}},{ff:{_desired:"fuv",_distance:"10",_oneway:"true"}},{gn:{_desired:"gnw",_distance:"10",_oneway:"true"}},{gn:{_desired:"gui",_distance:"10",_oneway:"true"}},{gn:{_desired:"gun",_distance:"10",_oneway:"true"}},{gn:{_desired:"nhd",_distance:"10",_oneway:"true"}},{iu:{_desired:"ikt",_distance:"10",_oneway:"true"}},{kln:{_desired:"enb",_distance:"10",_oneway:"true"}},{kln:{_desired:"eyo",_distance:"10",_oneway:"true"}},{kln:{_desired:"niq",_distance:"10",_oneway:"true"}},{kln:{_desired:"oki",_distance:"10",_oneway:"true"}},{kln:{_desired:"pko",_distance:"10",_oneway:"true"}},{kln:{_desired:"sgc",_distance:"10",_oneway:"true"}},{kln:{_desired:"tec",_distance:"10",_oneway:"true"}},{kln:{_desired:"tuy",_distance:"10",_oneway:"true"}},{kok:{_desired:"gom",_distance:"10",_oneway:"true"}},{kpe:{_desired:"gkp",_distance:"10",_oneway:"true"}},{luy:{_desired:"ida",_distance:"10",_oneway:"true"}},{luy:{_desired:"lkb",_distance:"10",_oneway:"true"}},{luy:{_desired:"lko",_distance:"10",_oneway:"true"}},{luy:{_desired:"lks",_distance:"10",_oneway:"true"}},{luy:{_desired:"lri",_distance:"10",_oneway:"true"}},{luy:{_desired:"lrm",_distance:"10",_oneway:"true"}},{luy:{_desired:"lsm",_distance:"10",_oneway:"true"}},{luy:{_desired:"lto",_distance:"10",_oneway:"true"}},{luy:{_desired:"lts",_distance:"10",_oneway:"true"}},{luy:{_desired:"lwg",_distance:"10",_oneway:"true"}},{luy:{_desired:"nle",_distance:"10",_oneway:"true"}},{luy:{_desired:"nyd",_distance:"10",_oneway:"true"}},{luy:{_desired:"rag",_distance:"10",_oneway:"true"}},{lv:{_desired:"ltg",_distance:"10",_oneway:"true"}},{mg:{_desired:"bhr",_distance:"10",_oneway:"true"}},{mg:{_desired:"bjq",_distance:"10",_oneway:"true"}},{mg:{_desired:"bmm",_distance:"10",_oneway:"true"}},{mg:{_desired:"bzc",_distance:"10",_oneway:"true"}},{mg:{_desired:"msh",_distance:"10",_oneway:"true"}},{mg:{_desired:"skg",_distance:"10",_oneway:"true"}},{mg:{_desired:"tdx",_distance:"10",_oneway:"true"}},{mg:{_desired:"tkg",_distance:"10",_oneway:"true"}},{mg:{_desired:"txy",_distance:"10",_oneway:"true"}},{mg:{_desired:"xmv",_distance:"10",_oneway:"true"}},{mg:{_desired:"xmw",_distance:"10",_oneway:"true"}},{mn:{_desired:"mvf",_distance:"10",_oneway:"true"}},{ms:{_desired:"bjn",_distance:"10",_oneway:"true"}},{ms:{_desired:"btj",_distance:"10",_oneway:"true"}},{ms:{_desired:"bve",_distance:"10",_oneway:"true"}},{ms:{_desired:"bvu",_distance:"10",_oneway:"true"}},{ms:{_desired:"coa",_distance:"10",_oneway:"true"}},{ms:{_desired:"dup",_distance:"10",_oneway:"true"}},{ms:{_desired:"hji",_distance:"10",_oneway:"true"}},{ms:{_desired:"id",_distance:"10",_oneway:"true"}},{ms:{_desired:"jak",_distance:"10",_oneway:"true"}},{ms:{_desired:"jax",_distance:"10",_oneway:"true"}},{ms:{_desired:"kvb",_distance:"10",_oneway:"true"}},{ms:{_desired:"kvr",_distance:"10",_oneway:"true"}},{ms:{_desired:"kxd",_distance:"10",_oneway:"true"}},{ms:{_desired:"lce",_distance:"10",_oneway:"true"}},{ms:{_desired:"lcf",_distance:"10",_oneway:"true"}},{ms:{_desired:"liw",_distance:"10",_oneway:"true"}},{ms:{_desired:"max",_distance:"10",_oneway:"true"}},{ms:{_desired:"meo",_distance:"10",_oneway:"true"}},{ms:{_desired:"mfa",_distance:"10",_oneway:"true"}},{ms:{_desired:"mfb",_distance:"10",_oneway:"true"}},{ms:{_desired:"min",_distance:"10",_oneway:"true"}},{ms:{_desired:"mqg",_distance:"10",_oneway:"true"}},{ms:{_desired:"msi",_distance:"10",_oneway:"true"}},{ms:{_desired:"mui",_distance:"10",_oneway:"true"}},{ms:{_desired:"orn",_distance:"10",_oneway:"true"}},{ms:{_desired:"ors",_distance:"10",_oneway:"true"}},{ms:{_desired:"pel",_distance:"10",_oneway:"true"}},{ms:{_desired:"pse",_distance:"10",_oneway:"true"}},{ms:{_desired:"tmw",_distance:"10",_oneway:"true"}},{ms:{_desired:"urk",_distance:"10",_oneway:"true"}},{ms:{_desired:"vkk",_distance:"10",_oneway:"true"}},{ms:{_desired:"vkt",_distance:"10",_oneway:"true"}},{ms:{_desired:"xmm",_distance:"10",_oneway:"true"}},{ms:{_desired:"zlm",_distance:"10",_oneway:"true"}},{ms:{_desired:"zmi",_distance:"10",_oneway:"true"}},{ne:{_desired:"dty",_distance:"10",_oneway:"true"}},{om:{_desired:"gax",_distance:"10",_oneway:"true"}},{om:{_desired:"hae",_distance:"10",_oneway:"true"}},{om:{_desired:"orc",_distance:"10",_oneway:"true"}},{or:{_desired:"spv",_distance:"10",_oneway:"true"}},{ps:{_desired:"pbt",_distance:"10",_oneway:"true"}},{ps:{_desired:"pst",_distance:"10",_oneway:"true"}},{qu:{_desired:"qub",_distance:"10",_oneway:"true"}},{qu:{_desired:"qud",_distance:"10",_oneway:"true"}},{qu:{_desired:"quf",_distance:"10",_oneway:"true"}},{qu:{_desired:"qug",_distance:"10",_oneway:"true"}},{qu:{_desired:"quh",_distance:"10",_oneway:"true"}},{qu:{_desired:"quk",_distance:"10",_oneway:"true"}},{qu:{_desired:"qul",_distance:"10",_oneway:"true"}},{qu:{_desired:"qup",_distance:"10",_oneway:"true"}},{qu:{_desired:"qur",_distance:"10",_oneway:"true"}},{qu:{_desired:"qus",_distance:"10",_oneway:"true"}},{qu:{_desired:"quw",_distance:"10",_oneway:"true"}},{qu:{_desired:"qux",_distance:"10",_oneway:"true"}},{qu:{_desired:"quy",_distance:"10",_oneway:"true"}},{qu:{_desired:"qva",_distance:"10",_oneway:"true"}},{qu:{_desired:"qvc",_distance:"10",_oneway:"true"}},{qu:{_desired:"qve",_distance:"10",_oneway:"true"}},{qu:{_desired:"qvh",_distance:"10",_oneway:"true"}},{qu:{_desired:"qvi",_distance:"10",_oneway:"true"}},{qu:{_desired:"qvj",_distance:"10",_oneway:"true"}},{qu:{_desired:"qvl",_distance:"10",_oneway:"true"}},{qu:{_desired:"qvm",_distance:"10",_oneway:"true"}},{qu:{_desired:"qvn",_distance:"10",_oneway:"true"}},{qu:{_desired:"qvo",_distance:"10",_oneway:"true"}},{qu:{_desired:"qvp",_distance:"10",_oneway:"true"}},{qu:{_desired:"qvs",_distance:"10",_oneway:"true"}},{qu:{_desired:"qvw",_distance:"10",_oneway:"true"}},{qu:{_desired:"qvz",_distance:"10",_oneway:"true"}},{qu:{_desired:"qwa",_distance:"10",_oneway:"true"}},{qu:{_desired:"qwc",_distance:"10",_oneway:"true"}},{qu:{_desired:"qwh",_distance:"10",_oneway:"true"}},{qu:{_desired:"qws",_distance:"10",_oneway:"true"}},{qu:{_desired:"qxa",_distance:"10",_oneway:"true"}},{qu:{_desired:"qxc",_distance:"10",_oneway:"true"}},{qu:{_desired:"qxh",_distance:"10",_oneway:"true"}},{qu:{_desired:"qxl",_distance:"10",_oneway:"true"}},{qu:{_desired:"qxn",_distance:"10",_oneway:"true"}},{qu:{_desired:"qxo",_distance:"10",_oneway:"true"}},{qu:{_desired:"qxp",_distance:"10",_oneway:"true"}},{qu:{_desired:"qxr",_distance:"10",_oneway:"true"}},{qu:{_desired:"qxt",_distance:"10",_oneway:"true"}},{qu:{_desired:"qxu",_distance:"10",_oneway:"true"}},{qu:{_desired:"qxw",_distance:"10",_oneway:"true"}},{sc:{_desired:"sdc",_distance:"10",_oneway:"true"}},{sc:{_desired:"sdn",_distance:"10",_oneway:"true"}},{sc:{_desired:"sro",_distance:"10",_oneway:"true"}},{sq:{_desired:"aae",_distance:"10",_oneway:"true"}},{sq:{_desired:"aat",_distance:"10",_oneway:"true"}},{sq:{_desired:"aln",_distance:"10",_oneway:"true"}},{syr:{_desired:"aii",_distance:"10",_oneway:"true"}},{uz:{_desired:"uzs",_distance:"10",_oneway:"true"}},{yi:{_desired:"yih",_distance:"10",_oneway:"true"}},{zh:{_desired:"cdo",_distance:"10",_oneway:"true"}},{zh:{_desired:"cjy",_distance:"10",_oneway:"true"}},{zh:{_desired:"cpx",_distance:"10",_oneway:"true"}},{zh:{_desired:"czh",_distance:"10",_oneway:"true"}},{zh:{_desired:"czo",_distance:"10",_oneway:"true"}},{zh:{_desired:"gan",_distance:"10",_oneway:"true"}},{zh:{_desired:"hak",_distance:"10",_oneway:"true"}},{zh:{_desired:"hsn",_distance:"10",_oneway:"true"}},{zh:{_desired:"lzh",_distance:"10",_oneway:"true"}},{zh:{_desired:"mnp",_distance:"10",_oneway:"true"}},{zh:{_desired:"nan",_distance:"10",_oneway:"true"}},{zh:{_desired:"wuu",_distance:"10",_oneway:"true"}},{zh:{_desired:"yue",_distance:"10",_oneway:"true"}},{"*":{_desired:"*",_distance:"80"}},{"en-Latn":{_desired:"am-Ethi",_distance:"10",_oneway:"true"}},{"ru-Cyrl":{_desired:"az-Latn",_distance:"10",_oneway:"true"}},{"en-Latn":{_desired:"bn-Beng",_distance:"10",_oneway:"true"}},{"zh-Hans":{_desired:"bo-Tibt",_distance:"10",_oneway:"true"}},{"ru-Cyrl":{_desired:"hy-Armn",_distance:"10",_oneway:"true"}},{"en-Latn":{_desired:"ka-Geor",_distance:"10",_oneway:"true"}},{"en-Latn":{_desired:"km-Khmr",_distance:"10",_oneway:"true"}},{"en-Latn":{_desired:"kn-Knda",_distance:"10",_oneway:"true"}},{"en-Latn":{_desired:"lo-Laoo",_distance:"10",_oneway:"true"}},{"en-Latn":{_desired:"ml-Mlym",_distance:"10",_oneway:"true"}},{"en-Latn":{_desired:"my-Mymr",_distance:"10",_oneway:"true"}},{"en-Latn":{_desired:"ne-Deva",_distance:"10",_oneway:"true"}},{"en-Latn":{_desired:"or-Orya",_distance:"10",_oneway:"true"}},{"en-Latn":{_desired:"pa-Guru",_distance:"10",_oneway:"true"}},{"en-Latn":{_desired:"ps-Arab",_distance:"10",_oneway:"true"}},{"en-Latn":{_desired:"sd-Arab",_distance:"10",_oneway:"true"}},{"en-Latn":{_desired:"si-Sinh",_distance:"10",_oneway:"true"}},{"en-Latn":{_desired:"ta-Taml",_distance:"10",_oneway:"true"}},{"en-Latn":{_desired:"te-Telu",_distance:"10",_oneway:"true"}},{"en-Latn":{_desired:"ti-Ethi",_distance:"10",_oneway:"true"}},{"ru-Cyrl":{_desired:"tk-Latn",_distance:"10",_oneway:"true"}},{"en-Latn":{_desired:"ur-Arab",_distance:"10",_oneway:"true"}},{"ru-Cyrl":{_desired:"uz-Latn",_distance:"10",_oneway:"true"}},{"en-Latn":{_desired:"yi-Hebr",_distance:"10",_oneway:"true"}},{"sr-Cyrl":{_desired:"sr-Latn",_distance:"5"}},{"zh-Hans":{_desired:"za-Latn",_distance:"10",_oneway:"true"}},{"zh-Hans":{_desired:"zh-Hani",_distance:"20",_oneway:"true"}},{"zh-Hant":{_desired:"zh-Hani",_distance:"20",_oneway:"true"}},{"ar-Arab":{_desired:"ar-Latn",_distance:"20",_oneway:"true"}},{"bn-Beng":{_desired:"bn-Latn",_distance:"20",_oneway:"true"}},{"gu-Gujr":{_desired:"gu-Latn",_distance:"20",_oneway:"true"}},{"hi-Deva":{_desired:"hi-Latn",_distance:"20",_oneway:"true"}},{"kn-Knda":{_desired:"kn-Latn",_distance:"20",_oneway:"true"}},{"ml-Mlym":{_desired:"ml-Latn",_distance:"20",_oneway:"true"}},{"mr-Deva":{_desired:"mr-Latn",_distance:"20",_oneway:"true"}},{"ta-Taml":{_desired:"ta-Latn",_distance:"20",_oneway:"true"}},{"te-Telu":{_desired:"te-Latn",_distance:"20",_oneway:"true"}},{"zh-Hans":{_desired:"zh-Latn",_distance:"20",_oneway:"true"}},{"ja-Jpan":{_desired:"ja-Latn",_distance:"5",_oneway:"true"}},{"ja-Jpan":{_desired:"ja-Hani",_distance:"5",_oneway:"true"}},{"ja-Jpan":{_desired:"ja-Hira",_distance:"5",_oneway:"true"}},{"ja-Jpan":{_desired:"ja-Kana",_distance:"5",_oneway:"true"}},{"ja-Jpan":{_desired:"ja-Hrkt",_distance:"5",_oneway:"true"}},{"ja-Hrkt":{_desired:"ja-Hira",_distance:"5",_oneway:"true"}},{"ja-Hrkt":{_desired:"ja-Kana",_distance:"5",_oneway:"true"}},{"ko-Kore":{_desired:"ko-Hani",_distance:"5",_oneway:"true"}},{"ko-Kore":{_desired:"ko-Hang",_distance:"5",_oneway:"true"}},{"ko-Kore":{_desired:"ko-Jamo",_distance:"5",_oneway:"true"}},{"ko-Hang":{_desired:"ko-Jamo",_distance:"5",_oneway:"true"}},{"*-*":{_desired:"*-*",_distance:"50"}},{"ar-*-$maghreb":{_desired:"ar-*-$maghreb",_distance:"4"}},{"ar-*-$!maghreb":{_desired:"ar-*-$!maghreb",_distance:"4"}},{"ar-*-*":{_desired:"ar-*-*",_distance:"5"}},{"en-*-$enUS":{_desired:"en-*-$enUS",_distance:"4"}},{"en-*-GB":{_desired:"en-*-$!enUS",_distance:"3"}},{"en-*-$!enUS":{_desired:"en-*-$!enUS",_distance:"4"}},{"en-*-*":{_desired:"en-*-*",_distance:"5"}},{"es-*-$americas":{_desired:"es-*-$americas",_distance:"4"}},{"es-*-$!americas":{_desired:"es-*-$!americas",_distance:"4"}},{"es-*-*":{_desired:"es-*-*",_distance:"5"}},{"pt-*-$americas":{_desired:"pt-*-$americas",_distance:"4"}},{"pt-*-$!americas":{_desired:"pt-*-$!americas",_distance:"4"}},{"pt-*-*":{_desired:"pt-*-*",_distance:"5"}},{"zh-Hant-$cnsar":{_desired:"zh-Hant-$cnsar",_distance:"4"}},{"zh-Hant-$!cnsar":{_desired:"zh-Hant-$!cnsar",_distance:"4"}},{"zh-Hant-*":{_desired:"zh-Hant-*",_distance:"5"}},{"*-*-*":{_desired:"*-*-*",_distance:"4"}}]}}},n={"001":["001","001-status-grouping","002","005","009","011","013","014","015","017","018","019","021","029","030","034","035","039","053","054","057","061","142","143","145","150","151","154","155","AC","AD","AE","AF","AG","AI","AL","AM","AO","AQ","AR","AS","AT","AU","AW","AX","AZ","BA","BB","BD","BE","BF","BG","BH","BI","BJ","BL","BM","BN","BO","BQ","BR","BS","BT","BV","BW","BY","BZ","CA","CC","CD","CF","CG","CH","CI","CK","CL","CM","CN","CO","CP","CQ","CR","CU","CV","CW","CX","CY","CZ","DE","DG","DJ","DK","DM","DO","DZ","EA","EC","EE","EG","EH","ER","ES","ET","EU","EZ","FI","FJ","FK","FM","FO","FR","GA","GB","GD","GE","GF","GG","GH","GI","GL","GM","GN","GP","GQ","GR","GS","GT","GU","GW","GY","HK","HM","HN","HR","HT","HU","IC","ID","IE","IL","IM","IN","IO","IQ","IR","IS","IT","JE","JM","JO","JP","KE","KG","KH","KI","KM","KN","KP","KR","KW","KY","KZ","LA","LB","LC","LI","LK","LR","LS","LT","LU","LV","LY","MA","MC","MD","ME","MF","MG","MH","MK","ML","MM","MN","MO","MP","MQ","MR","MS","MT","MU","MV","MW","MX","MY","MZ","NA","NC","NE","NF","NG","NI","NL","NO","NP","NR","NU","NZ","OM","PA","PE","PF","PG","PH","PK","PL","PM","PN","PR","PS","PT","PW","PY","QA","QO","RE","RO","RS","RU","RW","SA","SB","SC","SD","SE","SG","SH","SI","SJ","SK","SL","SM","SN","SO","SR","SS","ST","SV","SX","SY","SZ","TA","TC","TD","TF","TG","TH","TJ","TK","TL","TM","TN","TO","TR","TT","TV","TW","TZ","UA","UG","UM","UN","US","UY","UZ","VA","VC","VE","VG","VI","VN","VU","WF","WS","XK","YE","YT","ZA","ZM","ZW"],"002":["002","002-status-grouping","011","014","015","017","018","202","AO","BF","BI","BJ","BW","CD","CF","CG","CI","CM","CV","DJ","DZ","EA","EG","EH","ER","ET","GA","GH","GM","GN","GQ","GW","IC","IO","KE","KM","LR","LS","LY","MA","MG","ML","MR","MU","MW","MZ","NA","NE","NG","RE","RW","SC","SD","SH","SL","SN","SO","SS","ST","SZ","TD","TF","TG","TN","TZ","UG","YT","ZA","ZM","ZW"],"003":["003","013","021","029","AG","AI","AW","BB","BL","BM","BQ","BS","BZ","CA","CR","CU","CW","DM","DO","GD","GL","GP","GT","HN","HT","JM","KN","KY","LC","MF","MQ","MS","MX","NI","PA","PM","PR","SV","SX","TC","TT","US","VC","VG","VI"],"005":["005","AR","BO","BR","BV","CL","CO","EC","FK","GF","GS","GY","PE","PY","SR","UY","VE"],"009":["009","053","054","057","061","AC","AQ","AS","AU","CC","CK","CP","CX","DG","FJ","FM","GU","HM","KI","MH","MP","NC","NF","NR","NU","NZ","PF","PG","PN","PW","QO","SB","TA","TK","TO","TV","UM","VU","WF","WS"],"011":["011","BF","BJ","CI","CV","GH","GM","GN","GW","LR","ML","MR","NE","NG","SH","SL","SN","TG"],"013":["013","BZ","CR","GT","HN","MX","NI","PA","SV"],"014":["014","BI","DJ","ER","ET","IO","KE","KM","MG","MU","MW","MZ","RE","RW","SC","SO","SS","TF","TZ","UG","YT","ZM","ZW"],"015":["015","DZ","EA","EG","EH","IC","LY","MA","SD","TN"],"017":["017","AO","CD","CF","CG","CM","GA","GQ","ST","TD"],"018":["018","BW","LS","NA","SZ","ZA"],"019":["003","005","013","019","019-status-grouping","021","029","419","AG","AI","AR","AW","BB","BL","BM","BO","BQ","BR","BS","BV","BZ","CA","CL","CO","CR","CU","CW","DM","DO","EC","FK","GD","GF","GL","GP","GS","GT","GY","HN","HT","JM","KN","KY","LC","MF","MQ","MS","MX","NI","PA","PE","PM","PR","PY","SR","SV","SX","TC","TT","US","UY","VC","VE","VG","VI"],"021":["021","BM","CA","GL","PM","US"],"029":["029","AG","AI","AW","BB","BL","BQ","BS","CU","CW","DM","DO","GD","GP","HT","JM","KN","KY","LC","MF","MQ","MS","PR","SX","TC","TT","VC","VG","VI"],"030":["030","CN","HK","JP","KP","KR","MN","MO","TW"],"034":["034","AF","BD","BT","IN","IR","LK","MV","NP","PK"],"035":["035","BN","ID","KH","LA","MM","MY","PH","SG","TH","TL","VN"],"039":["039","AD","AL","BA","ES","GI","GR","HR","IT","ME","MK","MT","PT","RS","SI","SM","VA","XK"],"053":["053","AU","CC","CX","HM","NF","NZ"],"054":["054","FJ","NC","PG","SB","VU"],"057":["057","FM","GU","KI","MH","MP","NR","PW","UM"],"061":["061","AS","CK","NU","PF","PN","TK","TO","TV","WF","WS"],142:["030","034","035","142","143","145","AE","AF","AM","AZ","BD","BH","BN","BT","CN","CY","GE","HK","ID","IL","IN","IQ","IR","JO","JP","KG","KH","KP","KR","KW","KZ","LA","LB","LK","MM","MN","MO","MV","MY","NP","OM","PH","PK","PS","QA","SA","SG","SY","TH","TJ","TL","TM","TR","TW","UZ","VN","YE"],143:["143","KG","KZ","TJ","TM","UZ"],145:["145","AE","AM","AZ","BH","CY","GE","IL","IQ","JO","KW","LB","OM","PS","QA","SA","SY","TR","YE"],150:["039","150","151","154","155","AD","AL","AT","AX","BA","BE","BG","BY","CH","CQ","CZ","DE","DK","EE","ES","FI","FO","FR","GB","GG","GI","GR","HR","HU","IE","IM","IS","IT","JE","LI","LT","LU","LV","MC","MD","ME","MK","MT","NL","NO","PL","PT","RO","RS","RU","SE","SI","SJ","SK","SM","UA","VA","XK"],151:["151","BG","BY","CZ","HU","MD","PL","RO","RU","SK","UA"],154:["154","AX","CQ","DK","EE","FI","FO","GB","GG","IE","IM","IS","JE","LT","LV","NO","SE","SJ"],155:["155","AT","BE","CH","DE","FR","LI","LU","MC","NL"],202:["011","014","017","018","202","AO","BF","BI","BJ","BW","CD","CF","CG","CI","CM","CV","DJ","ER","ET","GA","GH","GM","GN","GQ","GW","IO","KE","KM","LR","LS","MG","ML","MR","MU","MW","MZ","NA","NE","NG","RE","RW","SC","SH","SL","SN","SO","SS","ST","SZ","TD","TF","TG","TZ","UG","YT","ZA","ZM","ZW"],419:["005","013","029","419","AG","AI","AR","AW","BB","BL","BO","BQ","BR","BS","BV","BZ","CL","CO","CR","CU","CW","DM","DO","EC","FK","GD","GF","GP","GS","GT","GY","HN","HT","JM","KN","KY","LC","MF","MQ","MS","MX","NI","PA","PE","PR","PY","SR","SV","SX","TC","TT","UY","VC","VE","VG","VI"],EU:["AT","BE","BG","CY","CZ","DE","DK","EE","ES","EU","FI","FR","GR","HR","HU","IE","IT","LT","LU","LV","MT","NL","PL","PT","RO","SE","SI","SK"],EZ:["AT","BE","CY","DE","EE","ES","EZ","FI","FR","GR","IE","IT","LT","LU","LV","MT","NL","PT","SI","SK"],QO:["AC","AQ","CP","DG","QO","TA"],UN:["AD","AE","AF","AG","AL","AM","AO","AR","AT","AU","AZ","BA","BB","BD","BE","BF","BG","BH","BI","BJ","BN","BO","BR","BS","BT","BW","BY","BZ","CA","CD","CF","CG","CH","CI","CL","CM","CN","CO","CR","CU","CV","CY","CZ","DE","DJ","DK","DM","DO","DZ","EC","EE","EG","ER","ES","ET","FI","FJ","FM","FR","GA","GB","GD","GE","GH","GM","GN","GQ","GR","GT","GW","GY","HN","HR","HT","HU","ID","IE","IL","IN","IQ","IR","IS","IT","JM","JO","JP","KE","KG","KH","KI","KM","KN","KP","KR","KW","KZ","LA","LB","LC","LI","LK","LR","LS","LT","LU","LV","LY","MA","MC","MD","ME","MG","MH","MK","ML","MM","MN","MR","MT","MU","MV","MW","MX","MY","MZ","NA","NE","NG","NI","NL","NO","NP","NR","NZ","OM","PA","PE","PG","PH","PK","PL","PT","PW","PY","QA","RO","RS","RU","RW","SA","SB","SC","SD","SE","SG","SI","SK","SL","SM","SN","SO","SR","SS","ST","SV","SY","SZ","TD","TG","TH","TJ","TL","TM","TN","TO","TR","TT","TV","TZ","UA","UG","UN","US","UY","UZ","VC","VE","VN","VU","WS","YE","ZA","ZM","ZW"]},i=/-u(?:-[0-9a-z]{2,8})+/gi;function o(e,t,r=Error){if(!e)throw new r(t)}let l;function c(){if(!l){const e=s.supplemental.languageMatching["written-new"][0]?.paradigmLocales?._locales.split(" "),t=s.supplemental.languageMatching["written-new"].slice(1,5);l={matches:s.supplemental.languageMatching["written-new"].slice(5).map(e=>{const t=Object.keys(e)[0],r=e[t];return{supported:t,desired:r._desired,distance:+r._distance,oneway:"true"===r.oneway}},{}),matchVariables:t.reduce((e,t)=>{const r=Object.keys(t)[0],a=t[r];return e[r.slice(1)]=a._value.split("+"),e},{}),paradigmLocales:[...e,...e.map(e=>new Intl.Locale(e.replace(/_/g,"-")).maximize().toString())]}}return l}function d(e,t,r){const[a,s,i]=t.split("-");let o=!0;if(i&&"$"===i[0]){const t="!"!==i[1],a=(t?r[i.slice(1)]:r[i.slice(2)]).map(e=>n[e]||[e]).reduce((e,t)=>[...e,...t],[]);o&&=!(a.indexOf(e.region||"")>-1!=t)}else o&&=!e.region||("*"===i||i===e.region);return o&&=!e.script||("*"===s||s===e.script),o&&=!e.language||("*"===a||a===e.language),o}function u(e){return[e.language,e.script,e.region].filter(Boolean).join("-")}function h(e,t,r){for(const a of r.matches){let s=d(e,a.desired,r.matchVariables)&&d(t,a.supported,r.matchVariables);if(a.oneway||s||(s=d(e,a.supported,r.matchVariables)&&d(t,a.desired,r.matchVariables)),s){const s=10*a.distance;return r.paradigmLocales.indexOf(u(e))>-1!=r.paradigmLocales.indexOf(u(t))>-1?s-1:s}}throw new Error("No matching distance found")}const p=(0,a.B)(function(e,t){const r=new Intl.Locale(e).maximize(),a=new Intl.Locale(t).maximize(),s={language:r.language,script:r.script||"",region:r.region||""},n={language:a.language,script:a.script||"",region:a.region||""};let i=0;const o=c();return s.language!==n.language&&(i+=h({language:r.language,script:"",region:""},{language:a.language,script:"",region:""},o)),s.script!==n.script&&(i+=h({language:r.language,script:s.script,region:""},{language:a.language,script:n.script,region:""},o)),s.region!==n.region&&(i+=h(s,n,o)),i},{serializer:e=>`${e[0]}|${e[1]}`});function f(e){const t=[];let r=e;for(;r;){t.push(r);const e=r.lastIndexOf("-");if(-1===e)break;r=r.substring(0,e)}return t}const v=new WeakMap;function m(e,t,r){let a,s;const n=[],o=t.reduce((e,t)=>{const r=t.replace(i,"");return n.push(r),e[r]=t,e},{}),l=function(e,t,r=838){let a=1/0,s={matchedDesiredLocale:"",distances:{}},n=v.get(t);n||(n=t.map(e=>{try{return Intl.getCanonicalLocales([e])[0]||e}catch{return e}}),v.set(t,n));const i=new Set(n);for(let t=0;t<e.length;t++){const r=e[t];if(i.has(r)){const e=0+40*t;if(s.distances[r]={[r]:e},e<a&&(a=e,s.matchedDesiredLocale=r,s.matchedSupportedLocale=r),0===t)return s}}for(let t=0;t<e.length;t++){const r=e[t];try{const e=new Intl.Locale(r).maximize().toString();if(e!==r){const n=f(e);for(let o=0;o<n.length;o++){const l=n[o];if(l!==r&&i.has(l)){let n;try{n=new Intl.Locale(l).maximize().toString()===e?0+40*t:10*o+40*t}catch{n=10*o+40*t}s.distances[r]||(s.distances[r]={}),s.distances[r][l]=n,n<a&&(a=n,s.matchedDesiredLocale=r,s.matchedSupportedLocale=l);break}}}}catch{}}return s.matchedSupportedLocale&&0===a||(a=1/0,e.forEach((e,r)=>{s.distances[e]||(s.distances[e]={}),n.forEach((n,i)=>{const o=t[i],l=p(e,n)+0+40*r;s.distances[e][o]=l,l<a&&(a=l,s.matchedDesiredLocale=e,s.matchedSupportedLocale=o)})}),a>=r&&(s.matchedDesiredLocale=void 0,s.matchedSupportedLocale=void 0)),s}(n,e);return l.matchedSupportedLocale&&l.matchedDesiredLocale&&(a=l.matchedSupportedLocale,s=o[l.matchedDesiredLocale].slice(l.matchedDesiredLocale.length)||void 0),a?{locale:a,extension:s}:{locale:r()}}function g(e,t){let r=t.toLowerCase();return o(void 0!==e,"ukey must be defined"),r}function _(e){return Intl.getCanonicalLocales(e)[0]}const y=new WeakMap;function b(e,t){let r=y.get(e);r||(r=new Set(e),y.set(e,r));let a=t;for(;;){if(r.has(a))return a;let e=a.lastIndexOf("-");if(!~e)return;e>=2&&"-"===a[e-2]&&(e-=2),a=a.slice(0,e)}}function w(e,t,r,a,s,n){let l;l="lookup"===r.localeMatcher?function(e,t,r){const a={locale:""};for(const r of t){const t=r.replace(i,""),s=b(e,t);if(s)return a.locale=s,r!==t&&(a.extension=r.slice(t.length,r.length)),a}return a.locale=r(),a}(Array.from(e),t,n):m(Array.from(e),t,n),null==l&&(l={locale:n(),extension:""});let c=l.locale,d=s[c];const u={locale:"en",dataLocale:c};let h,p;l.extension?(h=function(e){o(e===e.toLowerCase(),"Expected extension to be lowercase"),o("-u-"===e.slice(0,3),"Expected extension to be a Unicode locale extension");const t=[],r=[];let a,s=e.length,n=3;for(;n<s;){let i,l=e.indexOf("-",n);i=-1===l?s-n:l-n;let c=e.slice(n,n+i);o(i>=2,"Expected a subtag to have at least 2 characters"),void 0===a&&2!=i?-1===t.indexOf(c)&&t.push(c):2===i?(a={key:c,value:""},void 0===r.find(e=>e.key===a?.key)&&r.push(a)):""===a?.value?a.value=c:(o(void 0!==a,"Expected keyword to be defined"),a.value+="-"+c),n+=i+1}return{attributes:t,keywords:r}}(l.extension),p=h.keywords):p=[];let f=[];for(const e of a){let t=d?.[e]??[];o(Array.isArray(t),`keyLocaleData for ${e} must be an array`);let a,s=t[0];o(void 0===s||"string"==typeof s,"value must be a string or undefined");let n=p.find(t=>t.key===e);if(n){let r=n.value;""!==r?t.indexOf(r)>-1&&(s=r,a={key:e,value:s}):t.indexOf("true")>-1&&(s="true",a={key:e,value:s})}let i=r[e];o(null==i||"string"==typeof i,"optionsValue must be a string or undefined"),"string"==typeof i&&(i=g(e.toLowerCase(),i),""===i&&(i="true")),i!==s&&t.indexOf(i)>-1&&(s=i,a=void 0),a&&f.push(a),u[e]=s}let v=[];return f.length>0&&(v=[],c=function(e,t,r){o(-1===e.indexOf("-u-"),"Expected locale to not have a Unicode locale extension");let a="-u";for(const e of t)a+=`-${e}`;for(const e of r){const{key:t,value:r}=e;a+=`-${t}`,""!==r&&(a+=`-${r}`)}if("-u"===a)return _(e);let s,n=e.indexOf("-x-");s=-1===n?e+a:e.slice(0,n)+a+e.slice(n);return _(s)}(c,v,f)),u.locale=c,u}function C(e,t){const r=[];for(const a of t){const t=b(e,a.replace(i,""));t&&r.push(t)}return r}function x(e,t,r,a){return w(t,(s=e,Intl.getCanonicalLocales(s)),{localeMatcher:a?.algorithm||"best fit"},[],{},()=>r).locale;var s}},688(e,t,r){r.d(t,{Z:()=>n});var a=r(2905);const s=["aa","aa-DJ","aa-ER","ab","af","af-NA","agq","ak","am","an","ann","apc","ar","ar-AE","ar-BH","ar-DJ","ar-DZ","ar-EG","ar-EH","ar-ER","ar-IL","ar-IQ","ar-JO","ar-KM","ar-KW","ar-LB","ar-LY","ar-MA","ar-MR","ar-OM","ar-PS","ar-QA","ar-SA","ar-SD","ar-SO","ar-SS","ar-SY","ar-TD","ar-TN","ar-YE","arn","as","asa","ast","az","az-Arab","az-Arab-IQ","az-Arab-TR","az-Cyrl","az-Latn","ba","bal","bal-Arab","bal-Latn","bas","be","be-tarask","bem","bew","bez","bg","bgc","bgn","bgn-AE","bgn-AF","bgn-IR","bgn-OM","bho","blo","blt","bm","bm-Nkoo","bn","bn-IN","bo","bo-IN","bqi","br","brx","bs","bs-Cyrl","bs-Latn","bss","bua","byn","ca","ca-AD","ca-ES-valencia","ca-FR","ca-IT","cad","cch","ccp","ccp-IN","ce","ceb","cgg","cho","chr","cic","ckb","ckb-IR","co","cop","cs","csw","cu","cv","cy","da","da-GL","dav","de","de-AT","de-BE","de-CH","de-IT","de-LI","de-LU","dje","doi","dsb","dua","dv","dyo","dz","ebu","ee","ee-TG","el","el-CY","el-polyton","en","en-001","en-150","en-AE","en-AG","en-AI","en-AS","en-AT","en-AU","en-BB","en-BE","en-BI","en-BM","en-BS","en-BW","en-BZ","en-CA","en-CC","en-CH","en-CK","en-CM","en-CX","en-CY","en-CZ","en-DE","en-DG","en-DK","en-DM","en-Dsrt","en-EE","en-ER","en-ES","en-FI","en-FJ","en-FK","en-FM","en-FR","en-GB","en-GD","en-GE","en-GG","en-GH","en-GI","en-GM","en-GS","en-GU","en-GY","en-HK","en-HU","en-ID","en-IE","en-IL","en-IM","en-IN","en-IO","en-IT","en-JE","en-JM","en-JP","en-KE","en-KI","en-KN","en-KY","en-LC","en-LR","en-LS","en-LT","en-LV","en-MG","en-MH","en-MO","en-MP","en-MS","en-MT","en-MU","en-MV","en-MW","en-MY","en-NA","en-NF","en-NG","en-NL","en-NO","en-NR","en-NU","en-NZ","en-PG","en-PH","en-PK","en-PL","en-PN","en-PR","en-PT","en-PW","en-RO","en-RW","en-SB","en-SC","en-SD","en-SE","en-SG","en-SH","en-SI","en-SK","en-SL","en-SS","en-SX","en-SZ","en-Shaw","en-TC","en-TK","en-TO","en-TT","en-TV","en-TZ","en-UA","en-UG","en-UM","en-VC","en-VG","en-VI","en-VU","en-WS","en-ZA","en-ZM","en-ZW","eo","es","es-419","es-AR","es-BO","es-BR","es-BZ","es-CL","es-CO","es-CR","es-CU","es-DO","es-EA","es-EC","es-GQ","es-GT","es-HN","es-IC","es-MX","es-NI","es-PA","es-PE","es-PH","es-PR","es-PY","es-SV","es-US","es-UY","es-VE","et","eu","ewo","fa","fa-AF","ff","ff-Adlm","ff-Adlm-BF","ff-Adlm-CM","ff-Adlm-GH","ff-Adlm-GM","ff-Adlm-GW","ff-Adlm-LR","ff-Adlm-MR","ff-Adlm-NE","ff-Adlm-NG","ff-Adlm-SL","ff-Adlm-SN","ff-Latn","ff-Latn-BF","ff-Latn-CM","ff-Latn-GH","ff-Latn-GM","ff-Latn-GN","ff-Latn-GW","ff-Latn-LR","ff-Latn-MR","ff-Latn-NE","ff-Latn-NG","ff-Latn-SL","fi","fil","fo","fo-DK","fr","fr-BE","fr-BF","fr-BI","fr-BJ","fr-BL","fr-CA","fr-CD","fr-CF","fr-CG","fr-CH","fr-CI","fr-CM","fr-DJ","fr-DZ","fr-GA","fr-GF","fr-GN","fr-GP","fr-GQ","fr-HT","fr-KM","fr-LU","fr-MA","fr-MC","fr-MF","fr-MG","fr-ML","fr-MQ","fr-MR","fr-MU","fr-NC","fr-NE","fr-PF","fr-PM","fr-RE","fr-RW","fr-SC","fr-SN","fr-SY","fr-TD","fr-TG","fr-TN","fr-VU","fr-WF","fr-YT","frr","fur","fy","ga","ga-GB","gaa","gd","gez","gez-ER","gl","gn","gsw","gsw-FR","gsw-LI","gu","guz","gv","ha","ha-Arab","ha-Arab-SD","ha-GH","ha-NE","haw","he","hi","hi-Latn","hnj","hnj-Hmnp","hr","hr-BA","hsb","ht","hu","hy","ia","id","ie","ig","ii","io","is","it","it-CH","it-SM","it-VA","iu","iu-Latn","ja","jbo","jgo","jmc","jv","ka","kaa","kaa-Cyrl","kaa-Latn","kab","kaj","kam","kcg","kde","kea","kek","ken","kgp","khq","ki","kk","kk-Arab","kk-Cyrl","kk-KZ","kkj","kl","kln","km","kn","ko","ko-CN","ko-KP","kok","kok-Deva","kok-Latn","kpe","kpe-GN","ks","ks-Arab","ks-Deva","ksb","ksf","ksh","ku","ku-Arab","ku-Arab-IR","ku-Latn","ku-Latn-IQ","ku-Latn-SY","ku-TR","kw","kxv","kxv-Deva","kxv-Latn","kxv-Orya","kxv-Telu","ky","la","lag","lb","lg","lij","lkt","lld","lmo","ln","ln-AO","ln-CF","ln-CG","lo","lrc","lrc-IQ","lt","ltg","lu","luo","luy","lv","lzz","mai","mas","mas-TZ","mdf","mer","mfe","mg","mgh","mgo","mhn","mi","mic","mk","ml","mn","mn-Mong","mn-Mong-MN","mni","mni-Beng","mni-Mtei","moh","mr","ms","ms-Arab","ms-Arab-BN","ms-BN","ms-ID","ms-SG","mt","mua","mus","mww","mww-Hmnp","my","myv","mzn","naq","nb","nb-SJ","nd","nds","nds-NL","ne","ne-IN","nl","nl-AW","nl-BE","nl-BQ","nl-CW","nl-SR","nl-SX","nmg","nn","nnh","no","nqo","nr","nso","nus","nv","ny","nyn","oc","oc-ES","oka","oka-US","om","om-KE","or","os","os-RU","osa","pa","pa-Arab","pa-Guru","pap","pap-AW","pcm","pi","pi-Latn","pis","pl","pms","prg","ps","ps-PK","pt","pt-AO","pt-CH","pt-CV","pt-GQ","pt-GW","pt-LU","pt-MO","pt-MZ","pt-PT","pt-ST","pt-TL","qu","qu-BO","qu-EC","quc","raj","rhg","rhg-Rohg","rhg-Rohg-BD","rif","rm","rn","ro","ro-MD","rof","ru","ru-BY","ru-KG","ru-KZ","ru-MD","ru-UA","rw","rwk","sa","sah","saq","sat","sat-Deva","sat-Olck","sbp","sc","scn","sd","sd-Arab","sd-Deva","sdh","sdh-IQ","se","se-FI","se-SE","seh","ses","sg","sgs","shi","shi-Latn","shi-Tfng","shn","shn-TH","si","sid","sk","skr","sl","sma","sma-NO","smj","smj-NO","smn","sms","sn","so","so-DJ","so-ET","so-KE","sq","sq-MK","sq-XK","sr","sr-Cyrl","sr-Cyrl-BA","sr-Cyrl-ME","sr-Cyrl-XK","sr-Latn","sr-Latn-BA","sr-Latn-ME","sr-Latn-XK","ss","ss-SZ","ssy","st","st-LS","su","su-Latn","suz","suz-Deva","suz-Sunu","sv","sv-AX","sv-FI","sw","sw-CD","sw-KE","sw-UG","syr","syr-SY","szl","ta","ta-LK","ta-MY","ta-SG","te","teo","teo-KE","tg","th","ti","ti-ER","tig","tk","tn","tn-BW","to","tok","tpi","tr","tr-CY","trv","trw","ts","tt","twq","tyv","tzm","ug","uk","und","ur","ur-IN","uz","uz-Arab","uz-Cyrl","uz-Latn","vai","vai-Latn","vai-Vaii","ve","vec","vi","vmw","vo","vun","wa","wae","wal","wbp","wo","xh","xnr","xog","yav","yi","yo","yo-BJ","yrl","yrl-CO","yrl-VE","yue","yue-Hans","yue-Hant","yue-Hant-CN","yue-Hant-MO","za","zgh","zh","zh-Hans","zh-Hans-HK","zh-Hans-MO","zh-Hans-MY","zh-Hans-SG","zh-Hant","zh-Hant-HK","zh-Hant-MO","zh-Hant-MY","zh-Latn","zu"];function n(e="en"){if(!("undefined"!=typeof Intl&&"NumberFormat"in Intl&&function(){try{if("1E4 bits"!==new Intl.NumberFormat("en",{style:"unit",unit:"bit",unitDisplay:"long",notation:"scientific"}).format(1e4))return!1}catch{return!1}return!0}()&&function(){try{return"100.00M"===new Intl.NumberFormat("en",{notation:"compact",minimumSignificantDigits:3,maximumSignificantDigits:3,minimumFractionDigits:2,maximumFractionDigits:2,roundingPriority:"morePrecision"}).format(1e8)}catch{return!1}}()&&(Intl.NumberFormat.polyfilled||Intl.NumberFormat.supportedLocalesOf(["es"]).length)&&function(e){if(!e)return!0;const t=Array.isArray(e)?e:[e];return Intl.NumberFormat.supportedLocalesOf(t).length===t.length}(e)))return e?(0,a.YW)([e],s,"en"):void 0}},4501(e,t,r){r.d(t,{Z:()=>n});var a=r(2905);const s=["af","ak","am","an","ar","ars","as","asa","ast","az","bal","be","bem","bez","bg","bho","blo","bm","bn","bo","br","brx","bs","ca","ce","ceb","cgg","chr","ckb","cs","csw","cv","cy","da","de","doi","dsb","dv","dz","ee","el","en","eo","es","et","eu","fa","ff","fi","fil","fo","fr","fur","fy","ga","gd","gl","gsw","gu","guw","gv","ha","haw","he","hi","hnj","hr","hsb","hu","hy","ia","id","ie","ig","ii","io","is","it","iu","ja","jbo","jgo","jmc","jv","jw","ka","kab","kaj","kcg","kde","kea","kk","kkj","kl","km","kn","ko","kok","kok-Latn","ks","ksb","ksh","ku","kw","ky","lag","lb","lg","lij","lkt","lld","ln","lo","lt","lv","mas","mg","mgo","mk","ml","mn","mo","mr","ms","mt","my","nah","naq","nb","nd","ne","nl","nn","nnh","no","nqo","nr","nso","ny","nyn","om","or","os","osa","pa","pap","pcm","pl","prg","ps","pt","pt-PT","rm","ro","rof","ru","rwk","sah","saq","sat","sc","scn","sd","sdh","se","seh","ses","sg","sgs","sh","shi","si","sk","sl","sma","smi","smj","smn","sms","sn","so","sq","sr","ss","ssy","st","su","sv","sw","syr","ta","te","teo","th","ti","tig","tk","tl","tn","to","tpi","tr","ts","tzm","ug","uk","und","ur","uz","ve","vec","vi","vo","vun","wa","wae","wo","xh","xog","yi","yo","yue","zh","zu"];function n(e="en"){if(!("PluralRules"in Intl)||"one"===new Intl.PluralRules("en",{minimumFractionDigits:2}).select(1)||!function(e){if(!e)return!0;const t=Array.isArray(e)?e:[e];return Intl.PluralRules.supportedLocalesOf(t).length===t.length}(e))return e?(0,a.YW)([e],s,"en"):void 0}},2288(e,t,r){r.d(t,{Z:()=>n});var a=r(2905);const s=["aa","aa-DJ","aa-ER","ab","af","af-NA","agq","ak","am","an","ann","apc","ar","ar-AE","ar-BH","ar-DJ","ar-DZ","ar-EG","ar-EH","ar-ER","ar-IL","ar-IQ","ar-JO","ar-KM","ar-KW","ar-LB","ar-LY","ar-MA","ar-MR","ar-OM","ar-PS","ar-QA","ar-SA","ar-SD","ar-SO","ar-SS","ar-SY","ar-TD","ar-TN","ar-YE","arn","as","asa","ast","az","az-Arab","az-Arab-IQ","az-Arab-TR","az-Cyrl","az-Latn","ba","bal","bal-Arab","bal-Latn","bas","be","be-tarask","bem","bew","bez","bg","bgc","bgn","bgn-AE","bgn-AF","bgn-IR","bgn-OM","bho","blo","blt","bm","bm-Nkoo","bn","bn-IN","bo","bo-IN","bqi","br","brx","bs","bs-Cyrl","bs-Latn","bss","bua","byn","ca","ca-AD","ca-ES-valencia","ca-FR","ca-IT","cad","cch","ccp","ccp-IN","ce","ceb","cgg","cho","chr","cic","ckb","ckb-IR","co","cop","cs","csw","cu","cv","cy","da","da-GL","dav","de","de-AT","de-BE","de-CH","de-IT","de-LI","de-LU","dje","doi","dsb","dua","dv","dyo","dz","ebu","ee","ee-TG","el","el-CY","el-polyton","en","en-001","en-150","en-AE","en-AG","en-AI","en-AS","en-AT","en-AU","en-BB","en-BE","en-BI","en-BM","en-BS","en-BW","en-BZ","en-CA","en-CC","en-CH","en-CK","en-CM","en-CX","en-CY","en-CZ","en-DE","en-DG","en-DK","en-DM","en-Dsrt","en-EE","en-ER","en-ES","en-FI","en-FJ","en-FK","en-FM","en-FR","en-GB","en-GD","en-GE","en-GG","en-GH","en-GI","en-GM","en-GS","en-GU","en-GY","en-HK","en-HU","en-ID","en-IE","en-IL","en-IM","en-IN","en-IO","en-IT","en-JE","en-JM","en-JP","en-KE","en-KI","en-KN","en-KY","en-LC","en-LR","en-LS","en-LT","en-LV","en-MG","en-MH","en-MO","en-MP","en-MS","en-MT","en-MU","en-MV","en-MW","en-MY","en-NA","en-NF","en-NG","en-NL","en-NO","en-NR","en-NU","en-NZ","en-PG","en-PH","en-PK","en-PL","en-PN","en-PR","en-PT","en-PW","en-RO","en-RW","en-SB","en-SC","en-SD","en-SE","en-SG","en-SH","en-SI","en-SK","en-SL","en-SS","en-SX","en-SZ","en-Shaw","en-TC","en-TK","en-TO","en-TT","en-TV","en-TZ","en-UA","en-UG","en-UM","en-VC","en-VG","en-VI","en-VU","en-WS","en-ZA","en-ZM","en-ZW","eo","es","es-419","es-AR","es-BO","es-BR","es-BZ","es-CL","es-CO","es-CR","es-CU","es-DO","es-EA","es-EC","es-GQ","es-GT","es-HN","es-IC","es-MX","es-NI","es-PA","es-PE","es-PH","es-PR","es-PY","es-SV","es-US","es-UY","es-VE","et","eu","ewo","fa","fa-AF","ff","ff-Adlm","ff-Adlm-BF","ff-Adlm-CM","ff-Adlm-GH","ff-Adlm-GM","ff-Adlm-GW","ff-Adlm-LR","ff-Adlm-MR","ff-Adlm-NE","ff-Adlm-NG","ff-Adlm-SL","ff-Adlm-SN","ff-Latn","ff-Latn-BF","ff-Latn-CM","ff-Latn-GH","ff-Latn-GM","ff-Latn-GN","ff-Latn-GW","ff-Latn-LR","ff-Latn-MR","ff-Latn-NE","ff-Latn-NG","ff-Latn-SL","fi","fil","fo","fo-DK","fr","fr-BE","fr-BF","fr-BI","fr-BJ","fr-BL","fr-CA","fr-CD","fr-CF","fr-CG","fr-CH","fr-CI","fr-CM","fr-DJ","fr-DZ","fr-GA","fr-GF","fr-GN","fr-GP","fr-GQ","fr-HT","fr-KM","fr-LU","fr-MA","fr-MC","fr-MF","fr-MG","fr-ML","fr-MQ","fr-MR","fr-MU","fr-NC","fr-NE","fr-PF","fr-PM","fr-RE","fr-RW","fr-SC","fr-SN","fr-SY","fr-TD","fr-TG","fr-TN","fr-VU","fr-WF","fr-YT","frr","fur","fy","ga","ga-GB","gaa","gd","gez","gez-ER","gl","gn","gsw","gsw-FR","gsw-LI","gu","guz","gv","ha","ha-Arab","ha-Arab-SD","ha-GH","ha-NE","haw","he","hi","hi-Latn","hnj","hnj-Hmnp","hr","hr-BA","hsb","ht","hu","hy","ia","id","ie","ig","ii","io","is","it","it-CH","it-SM","it-VA","iu","iu-Latn","ja","jbo","jgo","jmc","jv","ka","kaa","kaa-Cyrl","kaa-Latn","kab","kaj","kam","kcg","kde","kea","kek","ken","kgp","khq","ki","kk","kk-Arab","kk-Cyrl","kk-KZ","kkj","kl","kln","km","kn","ko","ko-CN","ko-KP","kok","kok-Deva","kok-Latn","kpe","kpe-GN","ks","ks-Arab","ks-Deva","ksb","ksf","ksh","ku","ku-Arab","ku-Arab-IR","ku-Latn","ku-Latn-IQ","ku-Latn-SY","ku-TR","kw","kxv","kxv-Deva","kxv-Latn","kxv-Orya","kxv-Telu","ky","la","lag","lb","lg","lij","lkt","lld","lmo","ln","ln-AO","ln-CF","ln-CG","lo","lrc","lrc-IQ","lt","ltg","lu","luo","luy","lv","lzz","mai","mas","mas-TZ","mdf","mer","mfe","mg","mgh","mgo","mhn","mi","mic","mk","ml","mn","mn-Mong","mn-Mong-MN","mni","mni-Beng","mni-Mtei","moh","mr","ms","ms-Arab","ms-Arab-BN","ms-BN","ms-ID","ms-SG","mt","mua","mus","mww","mww-Hmnp","my","myv","mzn","naq","nb","nb-SJ","nd","nds","nds-NL","ne","ne-IN","nl","nl-AW","nl-BE","nl-BQ","nl-CW","nl-SR","nl-SX","nmg","nn","nnh","no","nqo","nr","nso","nus","nv","ny","nyn","oc","oc-ES","oka","oka-US","om","om-KE","or","os","os-RU","osa","pa","pa-Arab","pa-Guru","pap","pap-AW","pcm","pi","pi-Latn","pis","pl","pms","prg","ps","ps-PK","pt","pt-AO","pt-CH","pt-CV","pt-GQ","pt-GW","pt-LU","pt-MO","pt-MZ","pt-PT","pt-ST","pt-TL","qu","qu-BO","qu-EC","quc","raj","rhg","rhg-Rohg","rhg-Rohg-BD","rif","rm","rn","ro","ro-MD","rof","ru","ru-BY","ru-KG","ru-KZ","ru-MD","ru-UA","rw","rwk","sa","sah","saq","sat","sat-Deva","sat-Olck","sbp","sc","scn","sd","sd-Arab","sd-Deva","sdh","sdh-IQ","se","se-FI","se-SE","seh","ses","sg","sgs","shi","shi-Latn","shi-Tfng","shn","shn-TH","si","sid","sk","skr","sl","sma","sma-NO","smj","smj-NO","smn","sms","sn","so","so-DJ","so-ET","so-KE","sq","sq-MK","sq-XK","sr","sr-Cyrl","sr-Cyrl-BA","sr-Cyrl-ME","sr-Cyrl-XK","sr-Latn","sr-Latn-BA","sr-Latn-ME","sr-Latn-XK","ss","ss-SZ","ssy","st","st-LS","su","su-Latn","suz","suz-Deva","suz-Sunu","sv","sv-AX","sv-FI","sw","sw-CD","sw-KE","sw-UG","syr","syr-SY","szl","ta","ta-LK","ta-MY","ta-SG","te","teo","teo-KE","tg","th","ti","ti-ER","tig","tk","tn","tn-BW","to","tok","tpi","tr","tr-CY","trv","trw","ts","tt","twq","tyv","tzm","ug","uk","und","ur","ur-IN","uz","uz-Arab","uz-Cyrl","uz-Latn","vai","vai-Latn","vai-Vaii","ve","vec","vi","vmw","vo","vun","wa","wae","wal","wbp","wo","xh","xnr","xog","yav","yi","yo","yo-BJ","yrl","yrl-CO","yrl-VE","yue","yue-Hans","yue-Hant","yue-Hant-CN","yue-Hant-MO","za","zgh","zh","zh-Hans","zh-Hans-HK","zh-Hans-MO","zh-Hans-MY","zh-Hans-SG","zh-Hant","zh-Hant-HK","zh-Hant-MO","zh-Hant-MY","zh-Latn","zu"];function n(e="en"){if(!("RelativeTimeFormat"in Intl)||!function(e){if(!e)return!0;const t=Array.isArray(e)?e:[e];return Intl.RelativeTimeFormat.supportedLocalesOf(t).length===t.length}(e)||!function(e){try{return"numberingSystem"in new Intl.RelativeTimeFormat(e||"en",{numeric:"auto"}).resolvedOptions()}catch{return!1}}(e))return(0,a.YW)([e],s,"en")}},5171(e,t,r){r.a(e,async function(e,a){try{r.d(t,{A:()=>C});var s=r(8292),n=r(6037),i=r(5287),o=r(2179),l=r(7836),c=r(4775),d=r(6539),u=r(6644),h=r(2767),p=r(9951),f=r(3358),v=r(1831),m=(r(716),r(4789)),g=r(4335),_=e([m,v]);[m,v]=_.then?(await _)():_;var y=Object.defineProperty,b=Object.getOwnPropertyDescriptor,w=(e,t,r,a)=>{for(var s,n=a>1?void 0:a?b(t,r):t,i=e.length-1;i>=0;i--)(s=e[i])&&(n=(a?s(t,r,n):s(n))||n);return a&&n&&y(t,r,n),n};let C=class extends h.q{static get validators(){return[...super.validators,(0,d.i)()]}constructLightDOMButton(){const e=document.createElement("button");for(const t of this.attributes)"style"!==t.name&&e.setAttribute(t.name,t.value);return e.type=this.type,e.style.position="absolute !important",e.style.width="0 !important",e.style.height="0 !important",e.style.clipPath="inset(50%) !important",e.style.overflow="hidden !important",e.style.whiteSpace="nowrap !important",this.name&&(e.name=this.name),e.value=this.value||"",e}handleClick(e){if(this.disabled||this.loading)return e.preventDefault(),void e.stopImmediatePropagation();if("submit"!==this.type&&"reset"!==this.type)return;if(!this.getForm())return;const t=this.constructLightDOMButton();this.parentElement?.append(t),t.click(),t.remove()}handleInvalid(){this.dispatchEvent(new l.W)}handleLabelSlotChange(){const e=this.labelSlot.assignedNodes({flatten:!0});let t=!1,r=!1,a=!1,s=!1;const n="wa-icon"===this.iconTag;[...e].forEach(e=>{if(e.nodeType===Node.ELEMENT_NODE){const a=e;e.localName===this.iconTag&&(r=!0,t||(t=e.hasAttribute(n?"label":"aria-label"))),"wa-icon"===a.localName?(r=!0,t||(t=void 0!==a.label)):s=!0}else if(e.nodeType===Node.TEXT_NODE){(e.textContent?.trim()||"").length>0&&(a=!0)}}),this.isIconButton=r&&!a&&!s,this.isIconButton&&!t&&console.warn(`Icon buttons must have a label for screen readers. Add <${this.iconTag} ${n?"label":"aria-label"}="..."> to remove this warning.`,this)}isButton(){return!this.href}isLink(){return!!this.href}handleDisabledChange(){this.updateValidity()}setValue(...e){}click(){this.button.click()}focus(e){this.button.focus(e)}blur(){this.button.blur()}render(){const e=this.isLink(),t=e?o.eu`a`:o.eu`button`;return o.qy`
      <${t}
        part="base"
        class=${(0,n.H)({button:!0,caret:this.withCaret,disabled:this.disabled,loading:this.loading,rtl:"rtl"===this.localize.dir(),"has-label":this.hasSlotController.test("[default]"),"has-start":this.hasSlotController.test("start"),"has-end":this.hasSlotController.test("end"),"is-icon-button":this.isIconButton})}
        ?disabled=${(0,i.J)(e?void 0:this.disabled)}
        type=${(0,i.J)(e?void 0:this.type)}
        title=${this.title}
        name=${(0,i.J)(e?void 0:this.name)}
        value=${(0,i.J)(e?void 0:this.value)}
        href=${(0,i.J)(e?this.href:void 0)}
        target=${(0,i.J)(e?this.target:void 0)}
        download=${(0,i.J)(e?this.download:void 0)}
        rel=${(0,i.J)(e&&this.rel?this.rel:void 0)}
        role=${(0,i.J)(e?void 0:"button")}
        aria-disabled=${(0,i.J)(e&&this.disabled?"true":void 0)}
        aria-label=${(0,i.J)(this.ariaLabel??void 0)}
        tabindex=${this.disabled?"-1":"0"}
        @invalid=${this.isButton()?this.handleInvalid:null}
        @click=${this.handleClick}
      >
        <slot name="start" part="start" class="start"></slot>
        <slot part="label" class="label" @slotchange=${this.handleLabelSlotChange}></slot>
        <slot name="end" part="end" class="end"></slot>
        ${this.withCaret?o.qy`
                <wa-icon part="caret" class="caret" library="system" name="chevron-down" variant="solid"></wa-icon>
              `:""}
        ${this.loading?o.qy`<wa-spinner part="spinner"></wa-spinner>`:""}
      </${t}>
    `}constructor(){super(...arguments),this.assumeInteractionOn=["click"],this.hasSlotController=new c.X(this,"[default]","start","end"),this.localize=new v.c(this),this.invalid=!1,this.isIconButton=!1,this.title="",this.ariaLabel=null,this.variant="neutral",this.appearance="accent",this.size="medium",this.withCaret=!1,this.disabled=!1,this.loading=!1,this.pill=!1,this.type="button",this.iconTag="wa-icon"}};C.shadowRootOptions={...h.q.shadowRootOptions,delegatesFocus:!0},C.css=[g.A,f.A,p.A],w([(0,s.P)(".button")],C.prototype,"button",2),w([(0,s.P)("slot:not([name])")],C.prototype,"labelSlot",2),w([(0,s.wk)()],C.prototype,"invalid",2),w([(0,s.wk)()],C.prototype,"isIconButton",2),w([(0,s.MZ)()],C.prototype,"title",2),w([(0,s.MZ)({attribute:"aria-label"})],C.prototype,"ariaLabel",2),w([(0,s.MZ)({reflect:!0})],C.prototype,"variant",2),w([(0,s.MZ)({reflect:!0})],C.prototype,"appearance",2),w([(0,s.MZ)({reflect:!0})],C.prototype,"size",2),w([(0,s.MZ)({attribute:"with-caret",type:Boolean,reflect:!0})],C.prototype,"withCaret",2),w([(0,s.MZ)({type:Boolean})],C.prototype,"disabled",2),w([(0,s.MZ)({type:Boolean,reflect:!0})],C.prototype,"loading",2),w([(0,s.MZ)({type:Boolean,reflect:!0})],C.prototype,"pill",2),w([(0,s.MZ)()],C.prototype,"type",2),w([(0,s.MZ)({reflect:!0})],C.prototype,"name",2),w([(0,s.MZ)({reflect:!0})],C.prototype,"value",2),w([(0,s.MZ)({reflect:!0})],C.prototype,"href",2),w([(0,s.MZ)()],C.prototype,"target",2),w([(0,s.MZ)()],C.prototype,"rel",2),w([(0,s.MZ)()],C.prototype,"download",2),w([(0,s.MZ)({attribute:"formaction"})],C.prototype,"formAction",2),w([(0,s.MZ)({attribute:"formenctype"})],C.prototype,"formEnctype",2),w([(0,s.MZ)({attribute:"formmethod"})],C.prototype,"formMethod",2),w([(0,s.MZ)({attribute:"formnovalidate",type:Boolean})],C.prototype,"formNoValidate",2),w([(0,s.MZ)({attribute:"formtarget"})],C.prototype,"formTarget",2),w([(0,s.MZ)()],C.prototype,"iconTag",2),w([(0,u.w)("disabled",{waitUntilFirstUpdate:!0})],C.prototype,"handleDisabledChange",1),C=w([(0,s.EM)("wa-button")],C),a()}catch(e){a(e)}})},4335(e,t,r){r.d(t,{A:()=>a});var a=r(7983).AH`@layer wa-component {
  :host {
    display: inline-block;
  }
  :host:has(wa-badge) {
    position: relative;
  }
  :host(:has(wa-badge)) {
    position: relative;
  }
}
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  user-select: none;
  -webkit-user-select: none;
  white-space: nowrap;
  vertical-align: middle;
  transition-property:
    background,
    border,
    box-shadow,
    color,
    opacity;
  transition-duration: var(--wa-transition-fast);
  transition-timing-function: var(--wa-transition-easing);
  cursor: pointer;
  padding: 0 var(--wa-form-control-padding-inline);
  font-family: inherit;
  font-size: inherit;
  font-weight: var(--wa-font-weight-action);
  line-height: calc(var(--wa-form-control-height) - var(--border-width) * 2);
  height: var(--wa-form-control-height);
  width: 100%;
  background-color: var(--wa-color-fill-loud, var(--wa-color-neutral-fill-loud));
  border-color: transparent;
  color: var(--wa-color-on-loud, var(--wa-color-neutral-on-loud));
  border-radius: var(--wa-form-control-border-radius);
  border-style: var(--wa-border-style);
  border-width: var(--wa-border-width-s);
}
:host([appearance="plain"]) .button {
  color: var(--wa-color-on-quiet, var(--wa-color-neutral-on-quiet));
  background-color: transparent;
  border-color: transparent;
}
@media (hover: hover) {
  :host([appearance="plain"]) .button:not(.disabled):not(.loading):hover {
    color: var(--wa-color-on-quiet, var(--wa-color-neutral-on-quiet));
    background-color: var(--wa-color-fill-quiet, var(--wa-color-neutral-fill-quiet));
  }
}
:host([appearance="plain"]) .button:not(.disabled):not(.loading):active {
  color: var(--wa-color-on-quiet, var(--wa-color-neutral-on-quiet));
  background-color: color-mix(in oklab, var(--wa-color-fill-quiet, var(--wa-color-neutral-fill-quiet)), var(--wa-color-mix-active));
}
:host([appearance="outlined"]) .button {
  color: var(--wa-color-on-quiet, var(--wa-color-neutral-on-quiet));
  background-color: transparent;
  border-color: var(--wa-color-border-loud, var(--wa-color-neutral-border-loud));
}
@media (hover: hover) {
  :host([appearance="outlined"]) .button:not(.disabled):not(.loading):hover {
    color: var(--wa-color-on-quiet, var(--wa-color-neutral-on-quiet));
    background-color: var(--wa-color-fill-quiet, var(--wa-color-neutral-fill-quiet));
  }
}
:host([appearance="outlined"]) .button:not(.disabled):not(.loading):active {
  color: var(--wa-color-on-quiet, var(--wa-color-neutral-on-quiet));
  background-color: color-mix(in oklab, var(--wa-color-fill-quiet, var(--wa-color-neutral-fill-quiet)), var(--wa-color-mix-active));
}
:host([appearance="filled"]) .button {
  color: var(--wa-color-on-normal, var(--wa-color-neutral-on-normal));
  background-color: var(--wa-color-fill-normal, var(--wa-color-neutral-fill-normal));
  border-color: transparent;
}
@media (hover: hover) {
  :host([appearance="filled"]) .button:not(.disabled):not(.loading):hover {
    color: var(--wa-color-on-normal, var(--wa-color-neutral-on-normal));
    background-color: color-mix(in oklab, var(--wa-color-fill-normal, var(--wa-color-neutral-fill-normal)), var(--wa-color-mix-hover));
  }
}
:host([appearance="filled"]) .button:not(.disabled):not(.loading):active {
  color: var(--wa-color-on-normal, var(--wa-color-neutral-on-normal));
  background-color: color-mix(in oklab, var(--wa-color-fill-normal, var(--wa-color-neutral-fill-normal)), var(--wa-color-mix-active));
}
:host([appearance="filled-outlined"]) .button {
  color: var(--wa-color-on-normal, var(--wa-color-neutral-on-normal));
  background-color: var(--wa-color-fill-normal, var(--wa-color-neutral-fill-normal));
  border-color: var(--wa-color-border-normal, var(--wa-color-neutral-border-normal));
}
@media (hover: hover) {
  :host([appearance="filled-outlined"]) .button:not(.disabled):not(.loading):hover {
    color: var(--wa-color-on-normal, var(--wa-color-neutral-on-normal));
    background-color: color-mix(in oklab, var(--wa-color-fill-normal, var(--wa-color-neutral-fill-normal)), var(--wa-color-mix-hover));
  }
}
:host([appearance="filled-outlined"]) .button:not(.disabled):not(.loading):active {
  color: var(--wa-color-on-normal, var(--wa-color-neutral-on-normal));
  background-color: color-mix(in oklab, var(--wa-color-fill-normal, var(--wa-color-neutral-fill-normal)), var(--wa-color-mix-active));
}
:host([appearance="accent"]) .button {
  color: var(--wa-color-on-loud, var(--wa-color-neutral-on-loud));
  background-color: var(--wa-color-fill-loud, var(--wa-color-neutral-fill-loud));
  border-color: transparent;
}
@media (hover: hover) {
  :host([appearance="accent"]) .button:not(.disabled):not(.loading):hover {
    background-color: color-mix(in oklab, var(--wa-color-fill-loud, var(--wa-color-neutral-fill-loud)), var(--wa-color-mix-hover));
  }
}
:host([appearance="accent"]) .button:not(.disabled):not(.loading):active {
  background-color: color-mix(in oklab, var(--wa-color-fill-loud, var(--wa-color-neutral-fill-loud)), var(--wa-color-mix-active));
}
.button:focus {
  outline: none;
}
.button:focus-visible {
  outline: var(--wa-focus-ring);
  outline-offset: var(--wa-focus-ring-offset);
}
:host([disabled]) {
  opacity: 0.5;
  cursor: not-allowed;
}
:host([disabled]) .button {
  pointer-events: none;
}
.button::-moz-focus-inner {
  border: 0;
}
.button.is-icon-button {
  outline-offset: 2px;
  width: var(--wa-form-control-height);
  aspect-ratio: 1;
}
.button.is-icon-button:has(wa-icon) {
  width: auto;
}
:host([pill]) .button {
  border-radius: var(--wa-border-radius-pill);
}
.start,
.end {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  pointer-events: none;
}
.label {
  display: inline-block;
}
.is-icon-button .label {
  display: flex;
}
.label::slotted(wa-icon) {
  align-self: center;
}
wa-icon[part=caret] {
  display: flex;
  align-self: center;
  align-items: center;
}
wa-icon[part=caret]::part(svg) {
  width: 0.875em;
  height: 0.875em;
}
.button:has(wa-icon[part=caret]) .end {
  display: none;
}
.loading {
  position: relative;
  cursor: wait;
}
.loading .start,
.loading .label,
.loading .end,
.loading .caret {
  visibility: hidden;
}
.loading wa-spinner {
  --indicator-color: currentColor;
  --track-color: color-mix(in oklab, currentColor, transparent 90%);
  position: absolute;
  font-size: 1em;
  height: 1em;
  width: 1em;
  top: calc(50% - 0.5em);
  left: calc(50% - 0.5em);
}
.button ::slotted(wa-badge) {
  border-color: var(--wa-color-surface-default);
  position: absolute;
  inset-block-start: 0;
  inset-inline-end: 0;
  translate: 50% -50%;
  pointer-events: none;
}
:host(:dir(rtl)) ::slotted(wa-badge) {
  translate: -50% -50%;
}
slot[name=start]::slotted(*) {
  margin-inline-end: 0.75em;
}
slot[name=end]::slotted(*),
.button:not(.visually-hidden-label) [part=caret] {
  margin-inline-start: 0.75em;
}
:host(.wa-button-group__button) .button {
  border-radius: 0;
}
:host(.wa-button-group__horizontal.wa-button-group__button-first) .button {
  border-start-start-radius: var(--wa-form-control-border-radius);
  border-end-start-radius: var(--wa-form-control-border-radius);
}
:host(.wa-button-group__horizontal.wa-button-group__button-last) .button {
  border-start-end-radius: var(--wa-form-control-border-radius);
  border-end-end-radius: var(--wa-form-control-border-radius);
}
:host(.wa-button-group__vertical) {
  flex: 1 1 auto;
}
:host(.wa-button-group__vertical) .button {
  width: 100%;
  justify-content: start;
}
:host(.wa-button-group__vertical.wa-button-group__button-first) .button {
  border-start-start-radius: var(--wa-form-control-border-radius);
  border-start-end-radius: var(--wa-form-control-border-radius);
}
:host(.wa-button-group__vertical.wa-button-group__button-last) .button {
  border-end-start-radius: var(--wa-form-control-border-radius);
  border-end-end-radius: var(--wa-form-control-border-radius);
}
:host([pill].wa-button-group__horizontal.wa-button-group__button-first) .button {
  border-start-start-radius: var(--wa-border-radius-pill);
  border-end-start-radius: var(--wa-border-radius-pill);
}
:host([pill].wa-button-group__horizontal.wa-button-group__button-last) .button {
  border-start-end-radius: var(--wa-border-radius-pill);
  border-end-end-radius: var(--wa-border-radius-pill);
}
:host([pill].wa-button-group__vertical.wa-button-group__button-first) .button {
  border-start-start-radius: var(--wa-border-radius-pill);
  border-start-end-radius: var(--wa-border-radius-pill);
}
:host([pill].wa-button-group__vertical.wa-button-group__button-last) .button {
  border-end-start-radius: var(--wa-border-radius-pill);
  border-end-end-radius: var(--wa-border-radius-pill);
}
`},716(e,t,r){r(7254),r(7036);var a=r(7983),s=r(8292),n=r(7270);class i extends Event{constructor(){super("wa-error",{bubbles:!0,cancelable:!1,composed:!0})}}class o extends Event{constructor(){super("wa-load",{bubbles:!0,cancelable:!1,composed:!0})}}var l=r(6644),c=r(1574),d=a.AH`:host {
  --primary-color: currentColor;
  --primary-opacity: 1;
  --secondary-color: currentColor;
  --secondary-opacity: 0.4;
  --rotate-angle: 0deg;
  box-sizing: content-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: -0.125em;
}
:host(:not([auto-width])) {
  width: 1.25em;
  height: 1em;
}
:host([auto-width]) {
  width: auto;
  height: 1em;
}
svg {
  height: 1em;
  overflow: visible;
  width: auto;
}
svg path[data-duotone-primary] {
  color: var(--primary-color);
  opacity: var(--path-opacity, var(--primary-opacity));
}
svg path[data-duotone-secondary] {
  color: var(--secondary-color);
  opacity: var(--path-opacity, var(--secondary-opacity));
}
:host([rotate]) {
  transform: rotate(var(--rotate-angle, 0deg));
}
:host([flip="x"]) {
  transform: scaleX(-1);
}
:host([flip="y"]) {
  transform: scaleY(-1);
}
:host([flip="both"]) {
  transform: scale(-1, -1);
}
:host([rotate][flip="x"]) {
  transform: rotate(var(--rotate-angle, 0deg)) scaleX(-1);
}
:host([rotate][flip="y"]) {
  transform: rotate(var(--rotate-angle, 0deg)) scaleY(-1);
}
:host([rotate][flip="both"]) {
  transform: rotate(var(--rotate-angle, 0deg)) scale(-1, -1);
}
:host([animation="beat"]) {
  animation-name: beat;
  animation-delay: var(--animation-delay, 0s);
  animation-direction: var(--animation-direction, normal);
  animation-duration: var(--animation-duration, 1s);
  animation-iteration-count: var(--animation-iteration-count, infinite);
  animation-timing-function: var(--animation-timing, ease-in-out);
}
:host([animation="fade"]) {
  animation-name: fade;
  animation-delay: var(--animation-delay, 0s);
  animation-direction: var(--animation-direction, normal);
  animation-duration: var(--animation-duration, 1s);
  animation-iteration-count: var(--animation-iteration-count, infinite);
  animation-timing-function: var(--animation-timing, cubic-bezier(0.4, 0, 0.6, 1));
}
:host([animation="beat-fade"]) {
  animation-name: beat-fade;
  animation-delay: var(--animation-delay, 0s);
  animation-direction: var(--animation-direction, normal);
  animation-duration: var(--animation-duration, 1s);
  animation-iteration-count: var(--animation-iteration-count, infinite);
  animation-timing-function: var(--animation-timing, cubic-bezier(0.4, 0, 0.6, 1));
}
:host([animation="bounce"]) {
  animation-name: bounce;
  animation-delay: var(--animation-delay, 0s);
  animation-direction: var(--animation-direction, normal);
  animation-duration: var(--animation-duration, 1s);
  animation-iteration-count: var(--animation-iteration-count, infinite);
  animation-timing-function: var(--animation-timing, cubic-bezier(0.28, 0.84, 0.42, 1));
}
:host([animation="flip"]) {
  animation-name: flip;
  animation-delay: var(--animation-delay, 0s);
  animation-direction: var(--animation-direction, normal);
  animation-duration: var(--animation-duration, 1s);
  animation-iteration-count: var(--animation-iteration-count, infinite);
  animation-timing-function: var(--animation-timing, ease-in-out);
}
:host([animation="shake"]) {
  animation-name: shake;
  animation-delay: var(--animation-delay, 0s);
  animation-direction: var(--animation-direction, normal);
  animation-duration: var(--animation-duration, 1s);
  animation-iteration-count: var(--animation-iteration-count, infinite);
  animation-timing-function: var(--animation-timing, linear);
}
:host([animation="spin"]) {
  animation-name: spin;
  animation-delay: var(--animation-delay, 0s);
  animation-direction: var(--animation-direction, normal);
  animation-duration: var(--animation-duration, 2s);
  animation-iteration-count: var(--animation-iteration-count, infinite);
  animation-timing-function: var(--animation-timing, linear);
}
:host([animation="spin-pulse"]) {
  animation-name: spin-pulse;
  animation-direction: var(--animation-direction, normal);
  animation-duration: var(--animation-duration, 1s);
  animation-iteration-count: var(--animation-iteration-count, infinite);
  animation-timing-function: var(--animation-timing, steps(8));
}
:host([animation="spin-reverse"]) {
  animation-name: spin;
  animation-delay: var(--animation-delay, 0s);
  animation-direction: var(--animation-direction, reverse);
  animation-duration: var(--animation-duration, 2s);
  animation-iteration-count: var(--animation-iteration-count, infinite);
  animation-timing-function: var(--animation-timing, linear);
}
@media (prefers-reduced-motion: reduce) {
  :host([animation="beat"]),
  :host([animation="bounce"]),
  :host([animation="fade"]),
  :host([animation="beat-fade"]),
  :host([animation="flip"]),
  :host([animation="shake"]),
  :host([animation="spin"]),
  :host([animation="spin-pulse"]),
  :host([animation="spin-reverse"]) {
    animation: none !important;
    transition: none !important;
  }
}
@keyframes beat {
  0%, 90% {
    transform: scale(1);
  }
  45% {
    transform: scale(var(--beat-scale, 1.25));
  }
}
@keyframes fade {
  50% {
    opacity: var(--fade-opacity, 0.4);
  }
}
@keyframes beat-fade {
  0%, 100% {
    opacity: var(--beat-fade-opacity, 0.4);
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(var(--beat-fade-scale, 1.125));
  }
}
@keyframes bounce {
  0% {
    transform: scale(1, 1) translateY(0);
  }
  10% {
    transform: scale(var(--bounce-start-scale-x, 1.1), var(--bounce-start-scale-y, 0.9)) translateY(0);
  }
  30% {
    transform: scale(var(--bounce-jump-scale-x, 0.9), var(--bounce-jump-scale-y, 1.1)) translateY(var(--bounce-height, -0.5em));
  }
  50% {
    transform: scale(var(--bounce-land-scale-x, 1.05), var(--bounce-land-scale-y, 0.95)) translateY(0);
  }
  57% {
    transform: scale(1, 1) translateY(var(--bounce-rebound, -0.125em));
  }
  64% {
    transform: scale(1, 1) translateY(0);
  }
  100% {
    transform: scale(1, 1) translateY(0);
  }
}
@keyframes flip {
  50% {
    transform: rotate3d(var(--flip-x, 0), var(--flip-y, 1), var(--flip-z, 0), var(--flip-angle, -180deg));
  }
}
@keyframes shake {
  0% {
    transform: rotate(-15deg);
  }
  4% {
    transform: rotate(15deg);
  }
  8%, 24% {
    transform: rotate(-18deg);
  }
  12%, 28% {
    transform: rotate(18deg);
  }
  16% {
    transform: rotate(-22deg);
  }
  20% {
    transform: rotate(22deg);
  }
  32% {
    transform: rotate(-12deg);
  }
  36% {
    transform: rotate(12deg);
  }
  40%, 100% {
    transform: rotate(0deg);
  }
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
@keyframes spin-pulse {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
`;r(8111),r(2489),r(116),r(7588);let u="";function h(){if(!u){const t=document.querySelector("[data-fa-kit-code]");t&&(e=t.getAttribute("data-fa-kit-code")||"",u=e)}var e;return u}const p="7.2.0";const f={solid:{check:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">\x3c!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --\x3e<path fill="currentColor" d="M434.8 70.1c14.3 10.4 17.5 30.4 7.1 44.7l-256 352c-5.5 7.6-14 12.3-23.4 13.1s-18.5-2.7-25.1-9.3l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l101.5 101.5 234-321.7c10.4-14.3 30.4-17.5 44.7-7.1z"/></svg>',"chevron-down":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">\x3c!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --\x3e<path fill="currentColor" d="M201.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 338.7 54.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/></svg>',"chevron-left":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">\x3c!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --\x3e<path fill="currentColor" d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/></svg>',"chevron-right":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">\x3c!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --\x3e<path fill="currentColor" d="M311.1 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L243.2 256 73.9 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"/></svg>',circle:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">\x3c!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --\x3e<path fill="currentColor" d="M0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z"/></svg>',eyedropper:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">\x3c!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --\x3e<path fill="currentColor" d="M341.6 29.2l-101.6 101.6-9.4-9.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-9.4-9.4 101.6-101.6c39-39 39-102.2 0-141.1s-102.2-39-141.1 0zM55.4 323.3c-15 15-23.4 35.4-23.4 56.6l0 42.4-26.6 39.9c-8.5 12.7-6.8 29.6 4 40.4s27.7 12.5 40.4 4l39.9-26.6 42.4 0c21.2 0 41.6-8.4 56.6-23.4l109.4-109.4-45.3-45.3-109.4 109.4c-3 3-7.1 4.7-11.3 4.7l-36.1 0 0-36.1c0-4.2 1.7-8.3 4.7-11.3l109.4-109.4-45.3-45.3-109.4 109.4z"/></svg>',file:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">\x3c!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--\x3e<path fill="currentColor" d="M192 64C156.7 64 128 92.7 128 128L128 512C128 547.3 156.7 576 192 576L448 576C483.3 576 512 547.3 512 512L512 234.5C512 217.5 505.3 201.2 493.3 189.2L386.7 82.7C374.7 70.7 358.5 64 341.5 64L192 64zM453.5 240L360 240C346.7 240 336 229.3 336 216L336 122.5L453.5 240z"/></svg>',"file-audio":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">\x3c!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--\x3e<path fill="currentColor" d="M128 128C128 92.7 156.7 64 192 64L341.5 64C358.5 64 374.8 70.7 386.8 82.7L493.3 189.3C505.3 201.3 512 217.6 512 234.6L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 128zM336 122.5L336 216C336 229.3 346.7 240 360 240L453.5 240L336 122.5zM389.8 307.7C380.7 301.4 368.3 303.6 362 312.7C355.7 321.8 357.9 334.2 367 340.5C390.9 357.2 406.4 384.8 406.4 416C406.4 447.2 390.8 474.9 367 491.5C357.9 497.8 355.7 510.3 362 519.3C368.3 528.3 380.8 530.6 389.8 524.3C423.9 500.5 446.4 460.8 446.4 416C446.4 371.2 424 331.5 389.8 307.7zM208 376C199.2 376 192 383.2 192 392L192 440C192 448.8 199.2 456 208 456L232 456L259.2 490C262.2 493.8 266.8 496 271.7 496L272 496C280.8 496 288 488.8 288 480L288 352C288 343.2 280.8 336 272 336L271.7 336C266.8 336 262.2 338.2 259.2 342L232 376L208 376zM336 448.2C336 458.9 346.5 466.4 354.9 459.8C367.8 449.5 376 433.7 376 416C376 398.3 367.8 382.5 354.9 372.2C346.5 365.5 336 373.1 336 383.8L336 448.3z"/></svg>',"file-code":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">\x3c!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--\x3e<path fill="currentColor" d="M128 128C128 92.7 156.7 64 192 64L341.5 64C358.5 64 374.8 70.7 386.8 82.7L493.3 189.3C505.3 201.3 512 217.6 512 234.6L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 128zM336 122.5L336 216C336 229.3 346.7 240 360 240L453.5 240L336 122.5zM282.2 359.6C290.8 349.5 289.7 334.4 279.6 325.8C269.5 317.2 254.4 318.3 245.8 328.4L197.8 384.4C190.1 393.4 190.1 406.6 197.8 415.6L245.8 471.6C254.4 481.7 269.6 482.8 279.6 474.2C289.6 465.6 290.8 450.4 282.2 440.4L247.6 400L282.2 359.6zM394.2 328.4C385.6 318.3 370.4 317.2 360.4 325.8C350.4 334.4 349.2 349.6 357.8 359.6L392.4 400L357.8 440.4C349.2 450.5 350.3 465.6 360.4 474.2C370.5 482.8 385.6 481.7 394.2 471.6L442.2 415.6C449.9 406.6 449.9 393.4 442.2 384.4L394.2 328.4z"/></svg>',"file-excel":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">\x3c!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--\x3e<path fill="currentColor" d="M128 128C128 92.7 156.7 64 192 64L341.5 64C358.5 64 374.8 70.7 386.8 82.7L493.3 189.3C505.3 201.3 512 217.6 512 234.6L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 128zM336 122.5L336 216C336 229.3 346.7 240 360 240L453.5 240L336 122.5zM292 330.7C284.6 319.7 269.7 316.7 258.7 324C247.7 331.3 244.7 346.3 252 357.3L291.2 416L252 474.7C244.6 485.7 247.6 500.6 258.7 508C269.8 515.4 284.6 512.4 292 501.3L320 459.3L348 501.3C355.4 512.3 370.3 515.3 381.3 508C392.3 500.7 395.3 485.7 388 474.7L348.8 416L388 357.3C395.4 346.3 392.4 331.4 381.3 324C370.2 316.6 355.4 319.6 348 330.7L320 372.7L292 330.7z"/></svg>',"file-image":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">\x3c!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--\x3e<path fill="currentColor" d="M128 128C128 92.7 156.7 64 192 64L341.5 64C358.5 64 374.8 70.7 386.8 82.7L493.3 189.3C505.3 201.3 512 217.6 512 234.6L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 128zM336 122.5L336 216C336 229.3 346.7 240 360 240L453.5 240L336 122.5zM256 320C256 302.3 241.7 288 224 288C206.3 288 192 302.3 192 320C192 337.7 206.3 352 224 352C241.7 352 256 337.7 256 320zM220.6 512L419.4 512C435.2 512 448 499.2 448 483.4C448 476.1 445.2 469 440.1 463.7L343.3 361.9C337.3 355.6 328.9 352 320.1 352L319.8 352C311 352 302.7 355.6 296.6 361.9L199.9 463.7C194.8 469 192 476.1 192 483.4C192 499.2 204.8 512 220.6 512z"/></svg>',"file-pdf":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">\x3c!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--\x3e<path fill="currentColor" d="M128 64C92.7 64 64 92.7 64 128L64 512C64 547.3 92.7 576 128 576L208 576L208 464C208 428.7 236.7 400 272 400L448 400L448 234.5C448 217.5 441.3 201.2 429.3 189.2L322.7 82.7C310.7 70.7 294.5 64 277.5 64L128 64zM389.5 240L296 240C282.7 240 272 229.3 272 216L272 122.5L389.5 240zM272 444C261 444 252 453 252 464L252 592C252 603 261 612 272 612C283 612 292 603 292 592L292 564L304 564C337.1 564 364 537.1 364 504C364 470.9 337.1 444 304 444L272 444zM304 524L292 524L292 484L304 484C315 484 324 493 324 504C324 515 315 524 304 524zM400 444C389 444 380 453 380 464L380 592C380 603 389 612 400 612L432 612C460.7 612 484 588.7 484 560L484 496C484 467.3 460.7 444 432 444L400 444zM420 572L420 484L432 484C438.6 484 444 489.4 444 496L444 560C444 566.6 438.6 572 432 572L420 572zM508 464L508 592C508 603 517 612 528 612C539 612 548 603 548 592L548 548L576 548C587 548 596 539 596 528C596 517 587 508 576 508L548 508L548 484L576 484C587 484 596 475 596 464C596 453 587 444 576 444L528 444C517 444 508 453 508 464z"/></svg>',"file-powerpoint":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">\x3c!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--\x3e<path fill="currentColor" d="M128 128C128 92.7 156.7 64 192 64L341.5 64C358.5 64 374.8 70.7 386.8 82.7L493.3 189.3C505.3 201.3 512 217.6 512 234.6L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 128zM336 122.5L336 216C336 229.3 346.7 240 360 240L453.5 240L336 122.5zM280 320C266.7 320 256 330.7 256 344L256 488C256 501.3 266.7 512 280 512C293.3 512 304 501.3 304 488L304 464L328 464C367.8 464 400 431.8 400 392C400 352.2 367.8 320 328 320L280 320zM328 416L304 416L304 368L328 368C341.3 368 352 378.7 352 392C352 405.3 341.3 416 328 416z"/></svg>',"file-video":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">\x3c!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--\x3e<path fill="currentColor" d="M128 128C128 92.7 156.7 64 192 64L341.5 64C358.5 64 374.8 70.7 386.8 82.7L493.3 189.3C505.3 201.3 512 217.6 512 234.6L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 128zM336 122.5L336 216C336 229.3 346.7 240 360 240L453.5 240L336 122.5zM208 368L208 464C208 481.7 222.3 496 240 496L336 496C353.7 496 368 481.7 368 464L368 440L403 475C406.2 478.2 410.5 480 415 480C424.4 480 432 472.4 432 463L432 368.9C432 359.5 424.4 351.9 415 351.9C410.5 351.9 406.2 353.7 403 356.9L368 391.9L368 367.9C368 350.2 353.7 335.9 336 335.9L240 335.9C222.3 335.9 208 350.2 208 367.9z"/></svg>',"file-word":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">\x3c!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--\x3e<path fill="currentColor" d="M128 128C128 92.7 156.7 64 192 64L341.5 64C358.5 64 374.8 70.7 386.8 82.7L493.3 189.3C505.3 201.3 512 217.6 512 234.6L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 128zM336 122.5L336 216C336 229.3 346.7 240 360 240L453.5 240L336 122.5zM263.4 338.8C260.5 325.9 247.7 317.7 234.8 320.6C221.9 323.5 213.7 336.3 216.6 349.2L248.6 493.2C250.9 503.7 260 511.4 270.8 512C281.6 512.6 291.4 505.9 294.8 495.6L320 419.9L345.2 495.6C348.6 505.8 358.4 512.5 369.2 512C380 511.5 389.1 503.8 391.4 493.2L423.4 349.2C426.3 336.3 418.1 323.4 405.2 320.6C392.3 317.8 379.4 325.9 376.6 338.8L363.4 398.2L342.8 336.4C339.5 326.6 330.4 320 320 320C309.6 320 300.5 326.6 297.2 336.4L276.6 398.2L263.4 338.8z"/></svg>',"file-zipper":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">\x3c!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--\x3e<path fill="currentColor" d="M128 128C128 92.7 156.7 64 192 64L341.5 64C358.5 64 374.8 70.7 386.8 82.7L493.3 189.3C505.3 201.3 512 217.6 512 234.6L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 128zM336 122.5L336 216C336 229.3 346.7 240 360 240L453.5 240L336 122.5zM192 136C192 149.3 202.7 160 216 160L264 160C277.3 160 288 149.3 288 136C288 122.7 277.3 112 264 112L216 112C202.7 112 192 122.7 192 136zM192 232C192 245.3 202.7 256 216 256L264 256C277.3 256 288 245.3 288 232C288 218.7 277.3 208 264 208L216 208C202.7 208 192 218.7 192 232zM256 304L224 304C206.3 304 192 318.3 192 336L192 384C192 410.5 213.5 432 240 432C266.5 432 288 410.5 288 384L288 336C288 318.3 273.7 304 256 304zM240 368C248.8 368 256 375.2 256 384C256 392.8 248.8 400 240 400C231.2 400 224 392.8 224 384C224 375.2 231.2 368 240 368z"/></svg>',"grip-vertical":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">\x3c!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --\x3e<path fill="currentColor" d="M128 40c0-22.1-17.9-40-40-40L40 0C17.9 0 0 17.9 0 40L0 88c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zm0 192c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zM0 424l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40zM320 40c0-22.1-17.9-40-40-40L232 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zM192 232l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40zM320 424c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48z"/></svg>',indeterminate:'<svg part="indeterminate-icon" class="icon" viewBox="0 0 16 16"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" stroke-linecap="round"><g stroke="currentColor" stroke-width="2"><g transform="translate(2.285714 6.857143)"><path d="M10.2857143,1.14285714 L1.14285714,1.14285714"/></g></g></g></svg>',minus:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">\x3c!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --\x3e<path fill="currentColor" d="M0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32z"/></svg>',pause:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">\x3c!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --\x3e<path fill="currentColor" d="M48 32C21.5 32 0 53.5 0 80L0 432c0 26.5 21.5 48 48 48l64 0c26.5 0 48-21.5 48-48l0-352c0-26.5-21.5-48-48-48L48 32zm224 0c-26.5 0-48 21.5-48 48l0 352c0 26.5 21.5 48 48 48l64 0c26.5 0 48-21.5 48-48l0-352c0-26.5-21.5-48-48-48l-64 0z"/></svg>',play:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">\x3c!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --\x3e<path fill="currentColor" d="M91.2 36.9c-12.4-6.8-27.4-6.5-39.6 .7S32 57.9 32 72l0 368c0 14.1 7.5 27.2 19.6 34.4s27.2 7.5 39.6 .7l336-184c12.8-7 20.8-20.5 20.8-35.1s-8-28.1-20.8-35.1l-336-184z"/></svg>',plus:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">\x3c!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--\x3e<path fill="currentColor" d="M352 128C352 110.3 337.7 96 320 96C302.3 96 288 110.3 288 128L288 288L128 288C110.3 288 96 302.3 96 320C96 337.7 110.3 352 128 352L288 352L288 512C288 529.7 302.3 544 320 544C337.7 544 352 529.7 352 512L352 352L512 352C529.7 352 544 337.7 544 320C544 302.3 529.7 288 512 288L352 288L352 128z"/></svg>',star:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">\x3c!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --\x3e<path fill="currentColor" d="M309.5-18.9c-4.1-8-12.4-13.1-21.4-13.1s-17.3 5.1-21.4 13.1L193.1 125.3 33.2 150.7c-8.9 1.4-16.3 7.7-19.1 16.3s-.5 18 5.8 24.4l114.4 114.5-25.2 159.9c-1.4 8.9 2.3 17.9 9.6 23.2s16.9 6.1 25 2L288.1 417.6 432.4 491c8 4.1 17.7 3.3 25-2s11-14.2 9.6-23.2L441.7 305.9 556.1 191.4c6.4-6.4 8.6-15.8 5.8-24.4s-10.1-14.9-19.1-16.3L383 125.3 309.5-18.9z"/></svg>',upload:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">\x3c!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--\x3e<path fill="currentColor" d="M352 173.3L352 384C352 401.7 337.7 416 320 416C302.3 416 288 401.7 288 384L288 173.3L246.6 214.7C234.1 227.2 213.8 227.2 201.3 214.7C188.8 202.2 188.8 181.9 201.3 169.4L297.3 73.4C309.8 60.9 330.1 60.9 342.6 73.4L438.6 169.4C451.1 181.9 451.1 202.2 438.6 214.7C426.1 227.2 405.8 227.2 393.3 214.7L352 173.3zM320 464C364.2 464 400 428.2 400 384L480 384C515.3 384 544 412.7 544 448L544 480C544 515.3 515.3 544 480 544L160 544C124.7 544 96 515.3 96 480L96 448C96 412.7 124.7 384 160 384L240 384C240 428.2 275.8 464 320 464zM464 488C477.3 488 488 477.3 488 464C488 450.7 477.3 440 464 440C450.7 440 440 450.7 440 464C440 477.3 450.7 488 464 488z"/></svg>',user:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">\x3c!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --\x3e<path fill="currentColor" d="M224 248a120 120 0 1 0 0-240 120 120 0 1 0 0 240zm-29.7 56C95.8 304 16 383.8 16 482.3 16 498.7 29.3 512 45.7 512l356.6 0c16.4 0 29.7-13.3 29.7-29.7 0-98.5-79.8-178.3-178.3-178.3l-59.4 0z"/></svg>',xmark:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">\x3c!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --\x3e<path fill="currentColor" d="M55.1 73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L147.2 256 9.9 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192.5 301.3 329.9 438.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.8 256 375.1 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192.5 210.7 55.1 73.4z"/></svg>'},regular:{"circle-question":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">\x3c!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --\x3e<path fill="currentColor" d="M464 256a208 208 0 1 0 -416 0 208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0zm256-80c-17.7 0-32 14.3-32 32 0 13.3-10.7 24-24 24s-24-10.7-24-24c0-44.2 35.8-80 80-80s80 35.8 80 80c0 47.2-36 67.2-56 74.5l0 3.8c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-8.1c0-20.5 14.8-35.2 30.1-40.2 6.4-2.1 13.2-5.5 18.2-10.3 4.3-4.2 7.7-10 7.7-19.6 0-17.7-14.3-32-32-32zM224 368a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z"/></svg>',"circle-xmark":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">\x3c!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --\x3e<path fill="currentColor" d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464a256 256 0 1 0 0-512 256 256 0 1 0 0 512zM167 167c-9.4 9.4-9.4 24.6 0 33.9l55 55-55 55c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l55-55 55 55c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-55-55 55-55c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-55 55-55-55c-9.4-9.4-24.6-9.4-33.9 0z"/></svg>',copy:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">\x3c!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --\x3e<path fill="currentColor" d="M384 336l-192 0c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l133.5 0c4.2 0 8.3 1.7 11.3 4.7l58.5 58.5c3 3 4.7 7.1 4.7 11.3L400 320c0 8.8-7.2 16-16 16zM192 384l192 0c35.3 0 64-28.7 64-64l0-197.5c0-17-6.7-33.3-18.7-45.3L370.7 18.7C358.7 6.7 342.5 0 325.5 0L192 0c-35.3 0-64 28.7-64 64l0 256c0 35.3 28.7 64 64 64zM64 128c-35.3 0-64 28.7-64 64L0 448c0 35.3 28.7 64 64 64l192 0c35.3 0 64-28.7 64-64l0-16-48 0 0 16c0 8.8-7.2 16-16 16L64 464c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l16 0 0-48-16 0z"/></svg>',eye:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">\x3c!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --\x3e<path fill="currentColor" d="M288 80C222.8 80 169.2 109.6 128.1 147.7 89.6 183.5 63 226 49.4 256 63 286 89.6 328.5 128.1 364.3 169.2 402.4 222.8 432 288 432s118.8-29.6 159.9-67.7C486.4 328.5 513 286 526.6 256 513 226 486.4 183.5 447.9 147.7 406.8 109.6 353.2 80 288 80zM95.4 112.6C142.5 68.8 207.2 32 288 32s145.5 36.8 192.6 80.6c46.8 43.5 78.1 95.4 93 131.1 3.3 7.9 3.3 16.7 0 24.6-14.9 35.7-46.2 87.7-93 131.1-47.1 43.7-111.8 80.6-192.6 80.6S142.5 443.2 95.4 399.4c-46.8-43.5-78.1-95.4-93-131.1-3.3-7.9-3.3-16.7 0-24.6 14.9-35.7 46.2-87.7 93-131.1zM288 336c44.2 0 80-35.8 80-80 0-29.6-16.1-55.5-40-69.3-1.4 59.7-49.6 107.9-109.3 109.3 13.8 23.9 39.7 40 69.3 40zm-79.6-88.4c2.5 .3 5 .4 7.6 .4 35.3 0 64-28.7 64-64 0-2.6-.2-5.1-.4-7.6-37.4 3.9-67.2 33.7-71.1 71.1zm45.6-115c10.8-3 22.2-4.5 33.9-4.5 8.8 0 17.5 .9 25.8 2.6 .3 .1 .5 .1 .8 .2 57.9 12.2 101.4 63.7 101.4 125.2 0 70.7-57.3 128-128 128-61.6 0-113-43.5-125.2-101.4-1.8-8.6-2.8-17.5-2.8-26.6 0-11 1.4-21.8 4-32 .2-.7 .3-1.3 .5-1.9 11.9-43.4 46.1-77.6 89.5-89.5z"/></svg>',"eye-slash":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">\x3c!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --\x3e<path fill="currentColor" d="M41-24.9c-9.4-9.4-24.6-9.4-33.9 0S-2.3-.3 7 9.1l528 528c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-96.4-96.4c2.7-2.4 5.4-4.8 8-7.2 46.8-43.5 78.1-95.4 93-131.1 3.3-7.9 3.3-16.7 0-24.6-14.9-35.7-46.2-87.7-93-131.1-47.1-43.7-111.8-80.6-192.6-80.6-56.8 0-105.6 18.2-146 44.2L41-24.9zM176.9 111.1c32.1-18.9 69.2-31.1 111.1-31.1 65.2 0 118.8 29.6 159.9 67.7 38.5 35.7 65.1 78.3 78.6 108.3-13.6 30-40.2 72.5-78.6 108.3-3.1 2.8-6.2 5.6-9.4 8.4L393.8 328c14-20.5 22.2-45.3 22.2-72 0-70.7-57.3-128-128-128-26.7 0-51.5 8.2-72 22.2l-39.1-39.1zm182 182l-108-108c11.1-5.8 23.7-9.1 37.1-9.1 44.2 0 80 35.8 80 80 0 13.4-3.3 26-9.1 37.1zM103.4 173.2l-34-34c-32.6 36.8-55 75.8-66.9 104.5-3.3 7.9-3.3 16.7 0 24.6 14.9 35.7 46.2 87.7 93 131.1 47.1 43.7 111.8 80.6 192.6 80.6 37.3 0 71.2-7.9 101.5-20.6L352.2 422c-20 6.4-41.4 10-64.2 10-65.2 0-118.8-29.6-159.9-67.7-38.5-35.7-65.1-78.3-78.6-108.3 10.4-23.1 28.6-53.6 54-82.8z"/></svg>',star:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">\x3c!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --\x3e<path fill="currentColor" d="M288.1-32c9 0 17.3 5.1 21.4 13.1L383 125.3 542.9 150.7c8.9 1.4 16.3 7.7 19.1 16.3s.5 18-5.8 24.4L441.7 305.9 467 465.8c1.4 8.9-2.3 17.9-9.6 23.2s-17 6.1-25 2L288.1 417.6 143.8 491c-8 4.1-17.7 3.3-25-2s-11-14.2-9.6-23.2L134.4 305.9 20 191.4c-6.4-6.4-8.6-15.8-5.8-24.4s10.1-14.9 19.1-16.3l159.9-25.4 73.6-144.2c4.1-8 12.4-13.1 21.4-13.1zm0 76.8L230.3 158c-3.5 6.8-10 11.6-17.6 12.8l-125.5 20 89.8 89.9c5.4 5.4 7.9 13.1 6.7 20.7l-19.8 125.5 113.3-57.6c6.8-3.5 14.9-3.5 21.8 0l113.3 57.6-19.8-125.5c-1.2-7.6 1.3-15.3 6.7-20.7l89.8-89.9-125.5-20c-7.6-1.2-14.1-6-17.6-12.8L288.1 44.8z"/></svg>'}};let v="classic",m=[{name:"default",resolver:(e,t="classic",r="solid")=>function(e,t,r){const a=h();let s="solid";return"chisel"===t&&(s="chisel-regular"),"etch"===t&&(s="etch-solid"),"graphite"===t&&(s="graphite-thin"),"jelly"===t&&(s="jelly-regular","duo-regular"===r&&(s="jelly-duo-regular"),"fill-regular"===r&&(s="jelly-fill-regular")),"jelly-duo"===t&&(s="jelly-duo-regular"),"jelly-fill"===t&&(s="jelly-fill-regular"),"notdog"===t&&("solid"===r&&(s="notdog-solid"),"duo-solid"===r&&(s="notdog-duo-solid")),"notdog-duo"===t&&(s="notdog-duo-solid"),"slab"===t&&("solid"!==r&&"regular"!==r||(s="slab-regular"),"press-regular"===r&&(s="slab-press-regular")),"slab-press"===t&&(s="slab-press-regular"),"thumbprint"===t&&(s="thumbprint-light"),"utility"===t&&(s="utility-semibold"),"utility-duo"===t&&(s="utility-duo-semibold"),"utility-fill"===t&&(s="utility-fill-semibold"),"whiteboard"===t&&(s="whiteboard-semibold"),"classic"===t&&("thin"===r&&(s="thin"),"light"===r&&(s="light"),"regular"===r&&(s="regular"),"solid"===r&&(s="solid")),"duotone"===t&&("thin"===r&&(s="duotone-thin"),"light"===r&&(s="duotone-light"),"regular"===r&&(s="duotone-regular"),"solid"===r&&(s="duotone")),"sharp"===t&&("thin"===r&&(s="sharp-thin"),"light"===r&&(s="sharp-light"),"regular"===r&&(s="sharp-regular"),"solid"===r&&(s="sharp-solid")),"sharp-duotone"===t&&("thin"===r&&(s="sharp-duotone-thin"),"light"===r&&(s="sharp-duotone-light"),"regular"===r&&(s="sharp-duotone-regular"),"solid"===r&&(s="sharp-duotone-solid")),"brands"===t&&(s="brands"),a.length>0?`https://ka-p.fontawesome.com/releases/v${p}/svgs/${s}/${e}.svg?token=${encodeURIComponent(a)}`:`https://ka-f.fontawesome.com/releases/v${p}/svgs/${s}/${e}.svg`}(e,t,r),mutator:(e,t)=>{if(t?.family&&!e.hasAttribute("data-duotone-initialized")){const{family:r,variant:a}=t;if("duotone"===r||"sharp-duotone"===r||"notdog-duo"===r||"notdog"===r&&"duo-solid"===a||"jelly-duo"===r||"jelly"===r&&"duo-regular"===a||"utility-duo"===r||"thumbprint"===r){const r=[...e.querySelectorAll("path")],a=r.find(e=>!e.hasAttribute("opacity")),s=r.find(e=>e.hasAttribute("opacity"));if(!a||!s)return;if(a.setAttribute("data-duotone-primary",""),s.setAttribute("data-duotone-secondary",""),t.swapOpacity&&a&&s){const e=s.getAttribute("opacity")||"0.4";a.style.setProperty("--path-opacity",e),s.style.setProperty("--path-opacity","1")}e.setAttribute("data-duotone-initialized","")}}}},{name:"system",resolver:(e,t="classic",r="solid")=>{let a=f[r][e]??f.regular[e]??f.regular["circle-question"];return a?function(e){return`data:image/svg+xml,${encodeURIComponent(e)}`}(a):""}}],g=[];function _(e){return m.find(t=>t.name===e)}var y=Object.defineProperty,b=Object.getOwnPropertyDescriptor,w=(e,t,r,a)=>{for(var s,n=a>1?void 0:a?b(t,r):t,i=e.length-1;i>=0;i--)(s=e[i])&&(n=(a?s(t,r,n):s(n))||n);return a&&n&&y(t,r,n),n};const C=Symbol(),x=Symbol();let k;const L=new Map;let A=class extends c.A{connectedCallback(){var e;super.connectedCallback(),e=this,g.push(e)}firstUpdated(e){super.firstUpdated(e),this.hasAttribute("rotate")&&this.style.setProperty("--rotate-angle",`${this.rotate}deg`),this.setIcon()}disconnectedCallback(){var e;super.disconnectedCallback(),e=this,g=g.filter(t=>t!==e)}getIconSource(){const e=_(this.library),t=this.family||v;return this.name&&e?{url:e.resolver(this.name,t,this.variant,this.autoWidth),fromLibrary:!0}:{url:this.src,fromLibrary:!1}}handleLabelChange(){"string"==typeof this.label&&this.label.length>0?(this.setAttribute("role","img"),this.setAttribute("aria-label",this.label),this.removeAttribute("aria-hidden")):(this.removeAttribute("role"),this.removeAttribute("aria-label"),this.setAttribute("aria-hidden","true"))}async setIcon(){const{url:e,fromLibrary:t}=this.getIconSource(),r=t?_(this.library):void 0;if(!e)return void(this.svg=null);let a=L.get(e);a||(a=this.resolveIcon(e,r),L.set(e,a));const s=await a;if(s===x&&L.delete(e),e===this.getIconSource().url)if((0,n.qb)(s))this.svg=s;else switch(s){case x:case C:this.svg=null,this.dispatchEvent(new i);break;default:this.svg=s.cloneNode(!0),r?.mutator?.(this.svg,this),this.dispatchEvent(new o)}}updated(e){super.updated(e);const t=_(this.library);this.hasAttribute("rotate")&&this.style.setProperty("--rotate-angle",`${this.rotate}deg`);const r=this.shadowRoot?.querySelector("svg");r&&t?.mutator?.(r,this)}render(){return this.hasUpdated?this.svg:a.qy`<svg part="svg" width="16" height="16"></svg>`}constructor(){super(...arguments),this.svg=null,this.autoWidth=!1,this.swapOpacity=!1,this.label="",this.library="default",this.rotate=0,this.resolveIcon=async(e,t)=>{let r;if(t?.spriteSheet){this.hasUpdated||await this.updateComplete,this.svg=a.qy`<svg part="svg">
        <use part="use" href="${e}"></use>
      </svg>`,await this.updateComplete;const r=this.shadowRoot.querySelector("[part='svg']");return"function"==typeof t.mutator&&t.mutator(r,this),this.svg}try{if(r=await fetch(e,{mode:"cors"}),!r.ok)return 410===r.status?C:x}catch{return x}try{const e=document.createElement("div");e.innerHTML=await r.text();const t=e.firstElementChild;if("svg"!==t?.tagName?.toLowerCase())return C;k||(k=new DOMParser);const a=k.parseFromString(t.outerHTML,"text/html").body.querySelector("svg");return a?(a.part.add("svg"),document.adoptNode(a)):C}catch{return C}}}};A.css=d,w([(0,s.wk)()],A.prototype,"svg",2),w([(0,s.MZ)({reflect:!0})],A.prototype,"name",2),w([(0,s.MZ)({reflect:!0})],A.prototype,"family",2),w([(0,s.MZ)({reflect:!0})],A.prototype,"variant",2),w([(0,s.MZ)({attribute:"auto-width",type:Boolean,reflect:!0})],A.prototype,"autoWidth",2),w([(0,s.MZ)({attribute:"swap-opacity",type:Boolean,reflect:!0})],A.prototype,"swapOpacity",2),w([(0,s.MZ)()],A.prototype,"src",2),w([(0,s.MZ)()],A.prototype,"label",2),w([(0,s.MZ)({reflect:!0})],A.prototype,"library",2),w([(0,s.MZ)({type:Number,reflect:!0})],A.prototype,"rotate",2),w([(0,s.MZ)({type:String,reflect:!0})],A.prototype,"flip",2),w([(0,s.MZ)({type:String,reflect:!0})],A.prototype,"animation",2),w([(0,l.w)("label")],A.prototype,"handleLabelChange",1),w([(0,l.w)(["family","name","library","variant","src","autoWidth","swapOpacity"],{waitUntilFirstUpdate:!0})],A.prototype,"setIcon",1),A=w([(0,s.EM)("wa-icon")],A)},6882(e,t,r){r.a(e,async function(e,a){try{r.d(t,{A:()=>f});var s=r(7983),n=r(8292),i=r(3153),o=r(1574),l=r(1831),c=r(1169),d=e([l]);l=(d.then?(await d)():d)[0];var u=Object.defineProperty,h=Object.getOwnPropertyDescriptor,p=(e,t,r,a)=>{for(var s,n=a>1?void 0:a?h(t,r):t,i=e.length-1;i>=0;i--)(s=e[i])&&(n=(a?s(t,r,n):s(n))||n);return a&&n&&u(t,r,n),n};let f=class extends o.A{updated(e){if(super.updated(e),e.has("value")){const e=parseFloat(getComputedStyle(this.indicator).getPropertyValue("r")),t=2*Math.PI*e,r=t-this.value/100*t;this.indicatorOffset=`${r}px`}}render(){return s.qy`
      <div
        part="base"
        class="progress-ring"
        role="progressbar"
        aria-label=${this.label.length>0?this.label:this.localize.term("progress")}
        aria-describedby="label"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow="${this.value}"
        style=${(0,i.W)({"--percentage":this.value/100})}
      >
        <svg class="image">
          <circle part="track" class="track"></circle>
          <circle
            part="indicator"
            class="indicator"
            style=${(0,i.W)({"stroke-dashoffset":this.indicatorOffset})}
          ></circle>
        </svg>

        <slot id="label" part="label" class="label"></slot>
      </div>
    `}constructor(){super(...arguments),this.localize=new l.c(this),this.value=0,this.label=""}};f.css=c.A,p([(0,n.P)(".indicator")],f.prototype,"indicator",2),p([(0,n.wk)()],f.prototype,"indicatorOffset",2),p([(0,n.MZ)({type:Number,reflect:!0})],f.prototype,"value",2),p([(0,n.MZ)()],f.prototype,"label",2),f=p([(0,n.EM)("wa-progress-ring")],f),a()}catch(e){a(e)}})},1169(e,t,r){r.d(t,{A:()=>a});var a=r(7983).AH`:host {
  --size: 8rem;
  --track-width: 0.25em;
  --track-color: var(--wa-color-neutral-fill-normal);
  --indicator-width: var(--track-width);
  --indicator-color: var(--wa-color-brand-fill-loud);
  --indicator-transition-duration: 0.35s;
  display: inline-flex;
}
.progress-ring {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.image {
  width: var(--size);
  height: var(--size);
  rotate: -90deg;
  transform-origin: 50% 50%;
}
.track,
.indicator {
  --radius: calc(var(--size) / 2 - max(var(--track-width), var(--indicator-width)) * 0.5);
  --circumference: calc(var(--radius) * 2 * 3.141592654);
  fill: none;
  r: var(--radius);
  cx: calc(var(--size) / 2);
  cy: calc(var(--size) / 2);
}
.track {
  stroke: var(--track-color);
  stroke-width: var(--track-width);
}
.indicator {
  stroke: var(--indicator-color);
  stroke-width: var(--indicator-width);
  stroke-linecap: round;
  transition-property: stroke-dashoffset;
  transition-duration: var(--indicator-transition-duration);
  stroke-dasharray: var(--circumference) var(--circumference);
  stroke-dashoffset: calc(var(--circumference) - var(--percentage) * var(--circumference));
}
.label {
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  text-align: center;
  user-select: none;
  -webkit-user-select: none;
}
`},4789(e,t,r){r.a(e,async function(e,t){try{var a=r(7983),s=r(8292),n=r(1574),i=r(1831),o=r(1790),l=e([i]);i=(l.then?(await l)():l)[0];var c=Object.defineProperty,d=Object.getOwnPropertyDescriptor;let u=class extends n.A{render(){return a.qy`
      <svg
        part="base"
        role="progressbar"
        aria-label=${this.localize.term("loading")}
        fill="none"
        viewBox="0 0 50 50"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle class="track" cx="25" cy="25" r="20" fill="none" stroke-width="5" />
        <circle class="indicator" cx="25" cy="25" r="20" fill="none" stroke-width="5" />
      </svg>
    `}constructor(){super(...arguments),this.localize=new i.c(this)}};u.css=o.A,u=((e,t,r,a)=>{for(var s,n=a>1?void 0:a?d(t,r):t,i=e.length-1;i>=0;i--)(s=e[i])&&(n=(a?s(t,r,n):s(n))||n);return a&&n&&c(t,r,n),n})([(0,s.EM)("wa-spinner")],u),t()}catch(e){t(e)}})},1790(e,t,r){r.d(t,{A:()=>a});var a=r(7983).AH`:host {
  --track-width: 2px;
  --track-color: var(--wa-color-neutral-fill-normal);
  --indicator-color: var(--wa-color-brand-fill-loud);
  --speed: 2s;
  flex: none;
  display: inline-flex;
  width: 1em;
  height: 1em;
}
svg {
  width: 100%;
  height: 100%;
  aspect-ratio: 1;
  animation: spin var(--speed) linear infinite;
}
.track {
  stroke: var(--track-color);
}
.indicator {
  stroke: var(--indicator-color);
  stroke-dasharray: 75, 100;
  stroke-dashoffset: -5;
  animation: dash 1.5s ease-in-out infinite;
  stroke-linecap: round;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}
`},7836(e,t,r){r.d(t,{W:()=>a});class a extends Event{constructor(){super("wa-invalid",{bubbles:!0,cancelable:!1,composed:!0})}}},4775(e,t,r){r.d(t,{X:()=>a});r(4423);class a{hasDefaultSlot(){return!!this.host.childNodes&&[...this.host.childNodes].some(e=>{if(e.nodeType===Node.TEXT_NODE&&""!==e.textContent.trim())return!0;if(e.nodeType===Node.ELEMENT_NODE){const t=e;if("wa-visually-hidden"===t.tagName.toLowerCase())return!1;if(!t.hasAttribute("slot"))return!0}return!1})}hasNamedSlot(e){return null!==this.host.querySelector?.(`:scope > [slot="${e}"]`)}test(e){return"[default]"===e?this.hasDefaultSlot():this.hasNamedSlot(e)}hostConnected(){this.host.shadowRoot?.addEventListener?.("slotchange",this.handleSlotChange)}hostDisconnected(){this.host.shadowRoot?.removeEventListener?.("slotchange",this.handleSlotChange)}constructor(e,...t){this.slotNames=[],this.handleSlotChange=e=>{const t=e.target;(this.slotNames.includes("[default]")&&!t.name||t.name&&this.slotNames.includes(t.name))&&this.host.requestUpdate()},(this.host=e).addController(this),this.slotNames=t}}},6539(e,t,r){r.d(t,{i:()=>a});const a=()=>({checkValidity(e){const t=e.input,r={message:"",isValid:!0,invalidKeys:[]};if(!t)return r;let a=!0;if("checkValidity"in t&&(a=t.checkValidity()),a)return r;if(r.isValid=!1,"validationMessage"in t&&(r.message=t.validationMessage),!("validity"in t))return r.invalidKeys.push("customError"),r;for(const e in t.validity){if("valid"===e)continue;const a=e;t.validity[a]&&r.invalidKeys.push(a)}return r}})},6644(e,t,r){r.d(t,{w:()=>a});r(8111),r(7588);function a(e,t){const r={waitUntilFirstUpdate:!1,...t};return(t,a)=>{const{update:s}=t,n=Array.isArray(e)?e:[e];t.update=function(e){n.forEach(t=>{const s=t;if(e.has(s)){const t=e.get(s),n=this[s];t!==n&&(r.waitUntilFirstUpdate&&!this.hasUpdated||this[a](t,n))}}),s.call(this,e)}}}},1574(e,t,r){r.d(t,{A:()=>f});r(4423),r(8111),r(7588),r(7254),r(7036),r(805),r(3525);var a=r(7983),s=r(8292),n=a.AH`:host {
  box-sizing: border-box;
}
:host *,
:host *::before,
:host *::after {
  box-sizing: inherit;
}
[hidden] {
  display: none !important;
}
`;r(7642),r(5024),r(1698);class i extends Set{add(e){super.add(e);const t=this._existing;if(t)try{t.add(e)}catch{t.add(`--${e}`)}else this._el.setAttribute(`state-${e}`,"");return this}delete(e){super.delete(e);const t=this._existing;return t?(t.delete(e),t.delete(`--${e}`)):this._el.removeAttribute(`state-${e}`),!0}has(e){return super.has(e)}clear(){for(const e of this)this.delete(e)}constructor(e,t=null){super(),this._existing=null,this._el=e,this._existing=t}}const o=CSSStyleSheet.prototype.replaceSync;Object.defineProperty(CSSStyleSheet.prototype,"replaceSync",{value:function(e){e=e.replace(/:state\(([^)]+)\)/g,":where(:state($1), :--$1, [state-$1])"),o.call(this,e)}});var l,c=Object.defineProperty,d=Object.getOwnPropertyDescriptor,u=e=>{throw TypeError(e)},h=(e,t,r,a)=>{for(var s,n=a>1?void 0:a?d(t,r):t,i=e.length-1;i>=0;i--)(s=e[i])&&(n=(a?s(t,r,n):s(n))||n);return a&&n&&c(t,r,n),n},p=(e,t,r)=>t.has(e)||u("Cannot "+r);class f extends a.WF{static get styles(){const e=Array.isArray(this.css)?this.css:this.css?[this.css]:[];return[n,...e]}attachInternals(){const e=super.attachInternals();return Object.defineProperty(e,"states",{value:new i(this,e.states)}),e}attributeChangedCallback(e,t,r){var a,s,n;p(a=this,s=l,"read from private field"),(n?n.call(a):s.get(a))||(this.constructor.elementProperties.forEach((e,t)=>{e.reflect&&null!=this[t]&&this.initialReflectedProperties.set(t,this[t])}),((e,t,r,a)=>{p(e,t,"write to private field"),a?a.call(e,r):t.set(e,r)})(this,l,!0)),super.attributeChangedCallback(e,t,r)}willUpdate(e){super.willUpdate(e),this.initialReflectedProperties.forEach((t,r)=>{e.has(r)&&null==this[r]&&(this[r]=t)})}firstUpdated(e){super.firstUpdated(e),this.didSSR&&this.shadowRoot?.querySelectorAll("slot").forEach(e=>{e.dispatchEvent(new Event("slotchange",{bubbles:!0,composed:!1,cancelable:!1}))})}update(e){try{super.update(e)}catch(e){if(this.didSSR&&!this.hasUpdated){const t=new Event("lit-hydration-error",{bubbles:!0,composed:!0,cancelable:!1});t.error=e,this.dispatchEvent(t)}throw e}}relayNativeEvent(e,t){e.stopImmediatePropagation(),this.dispatchEvent(new e.constructor(e.type,{...e,...t}))}constructor(){var e,t,r;super(),e=this,r=!1,(t=l).has(e)?u("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,r),this.initialReflectedProperties=new Map,this.didSSR=a.S$||Boolean(this.shadowRoot),this.customStates={set:(e,t)=>{if(Boolean(this.internals?.states))try{t?this.internals.states.add(e):this.internals.states.delete(e)}catch(e){if(!String(e).includes("must start with '--'"))throw e;console.error("Your browser implements an outdated version of CustomStateSet. Consider using a polyfill")}},has:e=>{if(!Boolean(this.internals?.states))return!1;try{return this.internals.states.has(e)}catch{return!1}}};try{this.internals=this.attachInternals()}catch{console.error("Element internals are not supported in your browser. Consider using a polyfill")}this.customStates.set("wa-defined",!0);let s=this.constructor;for(let[e,t]of s.elementProperties)"inherit"===t.default&&void 0!==t.initial&&"string"==typeof e&&this.customStates.set(`initial-${e}-${t.initial}`,!0)}}l=new WeakMap,h([(0,s.MZ)()],f.prototype,"dir",2),h([(0,s.MZ)()],f.prototype,"lang",2),h([(0,s.MZ)({type:Boolean,reflect:!0,attribute:"did-ssr"})],f.prototype,"didSSR",2)},2767(e,t,r){r.d(t,{q:()=>d});r(4423),r(8111),r(7588),r(7642),r(5024),r(1698);var a=r(7983),s=r(8292),n=r(7836);var i=r(1574),o=Object.defineProperty,l=Object.getOwnPropertyDescriptor,c=(e,t,r,a)=>{for(var s,n=a>1?void 0:a?l(t,r):t,i=e.length-1;i>=0;i--)(s=e[i])&&(n=(a?s(t,r,n):s(n))||n);return a&&n&&o(t,r,n),n};class d extends i.A{static get validators(){return[{observedAttributes:["custom-error"],checkValidity(e){const t={message:"",isValid:!0,invalidKeys:[]};return e.customError&&(t.message=e.customError,t.isValid=!1,t.invalidKeys=["customError"]),t}}]}static get observedAttributes(){const e=new Set(super.observedAttributes||[]);for(const t of this.validators)if(t.observedAttributes)for(const r of t.observedAttributes)e.add(r);return[...e]}connectedCallback(){super.connectedCallback(),this.updateValidity(),this.assumeInteractionOn.forEach(e=>{this.addEventListener(e,this.handleInteraction)})}firstUpdated(...e){super.firstUpdated(...e),this.updateValidity()}willUpdate(e){if(!a.S$&&e.has("customError")&&(this.customError||(this.customError=null),this.setCustomValidity(this.customError||"")),e.has("value")||e.has("disabled")||e.has("defaultValue")){const e=this.value;if(Array.isArray(e)){if(this.name){const t=new FormData;for(const r of e)t.append(this.name,r);this.setValue(t,t)}}else this.setValue(e,e)}e.has("disabled")&&(this.customStates.set("disabled",this.disabled),(this.hasAttribute("disabled")||!a.S$&&!this.matches(":disabled"))&&this.toggleAttribute("disabled",this.disabled)),super.willUpdate(e),this.updateValidity()}get labels(){return this.internals.labels}getForm(){return this.internals.form}set form(e){e?this.setAttribute("form",e):this.removeAttribute("form")}get form(){return this.internals.form}get validity(){return this.internals.validity}get willValidate(){return this.internals.willValidate}get validationMessage(){return this.internals.validationMessage}checkValidity(){return this.updateValidity(),this.internals.checkValidity()}reportValidity(){return this.updateValidity(),this.hasInteracted=!0,this.internals.reportValidity()}get validationTarget(){return this.input||void 0}setValidity(...e){const t=e[0],r=e[1];let a=e[2];a||(a=this.validationTarget),this.internals.setValidity(t,r,a||void 0),this.requestUpdate("validity"),this.setCustomStates()}setCustomStates(){const e=Boolean(this.required),t=this.internals.validity.valid,r=this.hasInteracted;this.customStates.set("required",e),this.customStates.set("optional",!e),this.customStates.set("invalid",!t),this.customStates.set("valid",t),this.customStates.set("user-invalid",!t&&r),this.customStates.set("user-valid",t&&r)}setCustomValidity(e){if(!e)return this.customError=null,void this.setValidity({});this.customError=e,this.setValidity({customError:!0},e,this.validationTarget)}formResetCallback(){this.resetValidity(),this.hasInteracted=!1,this.valueHasChanged=!1,this.emittedEvents=[],this.updateValidity()}formDisabledCallback(e){this.disabled=e,this.updateValidity()}formStateRestoreCallback(e,t){this.value=e,"restore"===t&&this.resetValidity(),this.updateValidity()}setValue(...e){const[t,r]=e;this.internals.setFormValue(t,r)}get allValidators(){return[...this.constructor.validators||[],...this.validators||[]]}resetValidity(){this.setCustomValidity(""),this.setValidity({})}updateValidity(){if(this.disabled||this.hasAttribute("disabled")||!this.willValidate)return void this.resetValidity();const e=this.allValidators;if(!e?.length)return;const t={customError:Boolean(this.customError)},r=this.validationTarget||this.input||void 0;let a="";for(const r of e){const{isValid:e,message:s,invalidKeys:n}=r.checkValidity(this);e||(a||(a=s),n?.length>=0&&n.forEach(e=>t[e]=!0))}a||(a=this.validationMessage),this.setValidity(t,a,r)}constructor(){super(),this.name=null,this.disabled=!1,this.required=!1,this.assumeInteractionOn=["input"],this.validators=[],this.valueHasChanged=!1,this.hasInteracted=!1,this.customError=null,this.emittedEvents=[],this.emitInvalid=e=>{e.target===this&&(this.hasInteracted=!0,this.dispatchEvent(new n.W))},this.handleInteraction=e=>{const t=this.emittedEvents;t.includes(e.type)||t.push(e.type),t.length===this.assumeInteractionOn?.length&&(this.hasInteracted=!0)},a.S$||this.addEventListener("invalid",this.emitInvalid)}}d.formAssociated=!0,c([(0,s.MZ)({reflect:!0})],d.prototype,"name",2),c([(0,s.MZ)({type:Boolean})],d.prototype,"disabled",2),c([(0,s.MZ)({state:!0,attribute:!1})],d.prototype,"valueHasChanged",2),c([(0,s.MZ)({state:!0,attribute:!1})],d.prototype,"hasInteracted",2),c([(0,s.MZ)({attribute:"custom-error",reflect:!0})],d.prototype,"customError",2),c([(0,s.MZ)({attribute:!1,state:!0,type:Object})],d.prototype,"validity",1)},9951(e,t,r){r.d(t,{A:()=>a});var a=r(7983).AH`:host([size="small"]),
.wa-size-s {
  font-size: var(--wa-font-size-s);
}
:host([size="medium"]),
.wa-size-m {
  font-size: var(--wa-font-size-m);
}
:host([size="large"]),
.wa-size-l {
  font-size: var(--wa-font-size-l);
}
`},3358(e,t,r){r.d(t,{A:()=>a});var a=r(7983).AH`:where(:root),
.wa-neutral,
:host([variant="neutral"]) {
  --wa-color-fill-loud: var(--wa-color-neutral-fill-loud);
  --wa-color-fill-normal: var(--wa-color-neutral-fill-normal);
  --wa-color-fill-quiet: var(--wa-color-neutral-fill-quiet);
  --wa-color-border-loud: var(--wa-color-neutral-border-loud);
  --wa-color-border-normal: var(--wa-color-neutral-border-normal);
  --wa-color-border-quiet: var(--wa-color-neutral-border-quiet);
  --wa-color-on-loud: var(--wa-color-neutral-on-loud);
  --wa-color-on-normal: var(--wa-color-neutral-on-normal);
  --wa-color-on-quiet: var(--wa-color-neutral-on-quiet);
}
.wa-brand,
:host([variant="brand"]) {
  --wa-color-fill-loud: var(--wa-color-brand-fill-loud);
  --wa-color-fill-normal: var(--wa-color-brand-fill-normal);
  --wa-color-fill-quiet: var(--wa-color-brand-fill-quiet);
  --wa-color-border-loud: var(--wa-color-brand-border-loud);
  --wa-color-border-normal: var(--wa-color-brand-border-normal);
  --wa-color-border-quiet: var(--wa-color-brand-border-quiet);
  --wa-color-on-loud: var(--wa-color-brand-on-loud);
  --wa-color-on-normal: var(--wa-color-brand-on-normal);
  --wa-color-on-quiet: var(--wa-color-brand-on-quiet);
}
.wa-success,
:host([variant="success"]) {
  --wa-color-fill-loud: var(--wa-color-success-fill-loud);
  --wa-color-fill-normal: var(--wa-color-success-fill-normal);
  --wa-color-fill-quiet: var(--wa-color-success-fill-quiet);
  --wa-color-border-loud: var(--wa-color-success-border-loud);
  --wa-color-border-normal: var(--wa-color-success-border-normal);
  --wa-color-border-quiet: var(--wa-color-success-border-quiet);
  --wa-color-on-loud: var(--wa-color-success-on-loud);
  --wa-color-on-normal: var(--wa-color-success-on-normal);
  --wa-color-on-quiet: var(--wa-color-success-on-quiet);
}
.wa-warning,
:host([variant="warning"]) {
  --wa-color-fill-loud: var(--wa-color-warning-fill-loud);
  --wa-color-fill-normal: var(--wa-color-warning-fill-normal);
  --wa-color-fill-quiet: var(--wa-color-warning-fill-quiet);
  --wa-color-border-loud: var(--wa-color-warning-border-loud);
  --wa-color-border-normal: var(--wa-color-warning-border-normal);
  --wa-color-border-quiet: var(--wa-color-warning-border-quiet);
  --wa-color-on-loud: var(--wa-color-warning-on-loud);
  --wa-color-on-normal: var(--wa-color-warning-on-normal);
  --wa-color-on-quiet: var(--wa-color-warning-on-quiet);
}
.wa-danger,
:host([variant="danger"]) {
  --wa-color-fill-loud: var(--wa-color-danger-fill-loud);
  --wa-color-fill-normal: var(--wa-color-danger-fill-normal);
  --wa-color-fill-quiet: var(--wa-color-danger-fill-quiet);
  --wa-color-border-loud: var(--wa-color-danger-border-loud);
  --wa-color-border-normal: var(--wa-color-danger-border-normal);
  --wa-color-border-quiet: var(--wa-color-danger-border-quiet);
  --wa-color-on-loud: var(--wa-color-danger-on-loud);
  --wa-color-on-normal: var(--wa-color-danger-on-normal);
  --wa-color-on-quiet: var(--wa-color-danger-on-quiet);
}
`},7555(e,t,r){r.a(e,async function(e,a){try{r.d(t,{A:()=>i});var s=r(6941),n=e([s]);s=(n.then?(await n)():n)[0];const o={$code:"en",$name:"English",$dir:"ltr",carousel:"Carousel",clearEntry:"Clear entry",close:"Close",copied:"Copied",copy:"Copy",currentValue:"Current value",dropFileHere:"Drop file here or click to browse",decrement:"Decrement",dropFilesHere:"Drop files here or click to browse",error:"Error",goToSlide:(e,t)=>`Go to slide ${e} of ${t}`,hidePassword:"Hide password",increment:"Increment",loading:"Loading",nextSlide:"Next slide",numOptionsSelected:e=>0===e?"No options selected":1===e?"1 option selected":`${e} options selected`,pauseAnimation:"Pause animation",playAnimation:"Play animation",previousSlide:"Previous slide",progress:"Progress",remove:"Remove",resize:"Resize",scrollableRegion:"Scrollable region",scrollToEnd:"Scroll to end",scrollToStart:"Scroll to start",selectAColorFromTheScreen:"Select a color from the screen",showPassword:"Show password",slideNum:e=>`Slide ${e}`,toggleColorFormat:"Toggle color format",zoomIn:"Zoom in",zoomOut:"Zoom out"};(0,s.XC)(o);var i=o;a()}catch(e){a(e)}})},1831(e,t,r){r.a(e,async function(e,a){try{r.d(t,{c:()=>o});var s=r(6941),n=r(7555),i=e([s,n]);[s,n]=i.then?(await i)():i;class o extends s.c2{}(0,s.XC)(n.A),a()}catch(e){a(e)}})},462(e,t,r){r.d(t,{O2:()=>a,q6:()=>s,Gt:()=>l});class a extends Event{constructor(e,t,r,a){super("context-request",{bubbles:!0,composed:!0}),this.context=e,this.contextTarget=t,this.callback=r,this.subscribe=a??!1}}function s(e){return e}r(7642),r(5024),r(1698),r(7254),r(7036);class n{get value(){return this.o}set value(e){this.setValue(e)}setValue(e,t=!1){const r=t||!Object.is(e,this.o);this.o=e,r&&this.updateObservers()}addCallback(e,t,r){if(!r)return void e(this.value);this.subscriptions.has(e)||this.subscriptions.set(e,{disposer:()=>{this.subscriptions.delete(e)},consumerHost:t});const{disposer:a}=this.subscriptions.get(e);e(this.value,a)}clearCallbacks(){this.subscriptions.clear()}constructor(e){this.subscriptions=new Map,this.updateObservers=()=>{for(const[e,{disposer:t}]of this.subscriptions)e(this.o,t)},void 0!==e&&(this.value=e)}}class i extends Event{constructor(e,t){super("context-provider",{bubbles:!0,composed:!0}),this.context=e,this.contextTarget=t}}class o extends n{attachListeners(){this.host.addEventListener("context-request",this.onContextRequest),this.host.addEventListener("context-provider",this.onProviderRequest)}hostConnected(){this.host.dispatchEvent(new i(this.context,this.host))}constructor(e,t,r){super(void 0!==t.context?t.initialValue:r),this.onContextRequest=e=>{if(e.context!==this.context)return;const t=e.contextTarget??e.composedPath()[0];t!==this.host&&(e.stopPropagation(),this.addCallback(e.callback,t,e.subscribe))},this.onProviderRequest=e=>{if(e.context!==this.context)return;if((e.contextTarget??e.composedPath()[0])===this.host)return;const t=new Set;for(const[e,{consumerHost:r}]of this.subscriptions)t.has(e)||(t.add(e),r.dispatchEvent(new a(this.context,r,e,!0)));e.stopPropagation()},this.host=e,void 0!==t.context?this.context=t.context:this.context=t,this.attachListeners(),this.host.addController?.(this)}}r(805),r(3525);function l({context:e}){return(t,r)=>{const a=new WeakMap;if("object"==typeof r)return{get(){return t.get.call(this)},set(e){return a.get(this).setValue(e),t.set.call(this,e)},init(t){return a.set(this,new o(this,{context:e,initialValue:t})),t}};{t.constructor.addInitializer(t=>{a.set(t,new o(t,{context:e}))});const s=Object.getOwnPropertyDescriptor(t,r);let n;if(void 0===s){const e=new WeakMap;n={get(){return e.get(this)},set(t){a.get(this).setValue(t),e.set(this,t)},configurable:!0,enumerable:!0}}else{const e=s.set;n={...s,set(t){a.get(this).setValue(t),e?.call(this,t)}}}return void Object.defineProperty(t,r,n)}}}},7285(e,t,r){r.d(t,{mN:()=>k,AH:()=>l,W3:()=>w,Ec:()=>C});r(8111),r(7588),r(3110),r(7642),r(5024),r(1698),r(8335),r(7254),r(7036),r(465),r(805),r(3525),r(1701),r(8237);const a=globalThis,s=a.ShadowRoot&&(void 0===a.ShadyCSS||a.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,n=Symbol(),i=new WeakMap;class o{get styleSheet(){let e=this.o;const t=this.t;if(s&&void 0===e){const r=void 0!==t&&1===t.length;r&&(e=i.get(t)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),r&&i.set(t,e))}return e}toString(){return this.cssText}constructor(e,t,r){if(this._$cssResult$=!0,r!==n)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}}const l=(e,...t)=>{const r=1===e.length?e[0]:t.reduce((t,r,a)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(r)+e[a+1],e[0]);return new o(r,e,n)},c=s?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const r of e.cssRules)t+=r.cssText;return(e=>new o("string"==typeof e?e:e+"",void 0,n))(t)})(e):e,{is:d,defineProperty:u,getOwnPropertyDescriptor:h,getOwnPropertyNames:p,getOwnPropertySymbols:f,getPrototypeOf:v}=Object,m=globalThis,g=m.trustedTypes,_=g?g.emptyScript:"",y=m.reactiveElementPolyfillSupport,b=(e,t)=>e,w={toAttribute(e,t){switch(t){case Boolean:e=e?_:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let r=e;switch(t){case Boolean:r=null!==e;break;case Number:r=null===e?null:Number(e);break;case Object:case Array:try{r=JSON.parse(e)}catch(e){r=null}}return r}},C=(e,t)=>!d(e,t),x={attribute:!0,type:String,converter:w,reflect:!1,useDefault:!1,hasChanged:C};Symbol.metadata??=Symbol("metadata"),m.litPropertyMetadata??=new WeakMap;class k extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=x){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const r=Symbol(),a=this.getPropertyDescriptor(e,r,t);void 0!==a&&u(this.prototype,e,a)}}static getPropertyDescriptor(e,t,r){const{get:a,set:s}=h(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:a,set(t){const n=a?.call(this);s?.call(this,t),this.requestUpdate(e,n,r)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??x}static _$Ei(){if(this.hasOwnProperty(b("elementProperties")))return;const e=v(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(b("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(b("properties"))){const e=this.properties,t=[...p(e),...f(e)];for(const r of t)this.createProperty(r,e[r])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,r]of t)this.elementProperties.set(e,r)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const r=this._$Eu(e,t);void 0!==r&&this._$Eh.set(r,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const r=new Set(e.flat(1/0).reverse());for(const e of r)t.unshift(c(e))}else void 0!==e&&t.push(c(e));return t}static _$Eu(e,t){const r=t.attribute;return!1===r?void 0:"string"==typeof r?r:"string"==typeof e?e.toLowerCase():void 0}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const r of t.keys())this.hasOwnProperty(r)&&(e.set(r,this[r]),delete this[r]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((e,t)=>{if(s)e.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const r of t){const t=document.createElement("style"),s=a.litNonce;void 0!==s&&t.setAttribute("nonce",s),t.textContent=r.cssText,e.appendChild(t)}})(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,r){this._$AK(e,r)}_$ET(e,t){const r=this.constructor.elementProperties.get(e),a=this.constructor._$Eu(e,r);if(void 0!==a&&!0===r.reflect){const s=(void 0!==r.converter?.toAttribute?r.converter:w).toAttribute(t,r.type);this._$Em=e,null==s?this.removeAttribute(a):this.setAttribute(a,s),this._$Em=null}}_$AK(e,t){const r=this.constructor,a=r._$Eh.get(e);if(void 0!==a&&this._$Em!==a){const e=r.getPropertyOptions(a),s="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:w;this._$Em=a;const n=s.fromAttribute(t,e.type);this[a]=n??this._$Ej?.get(a)??n,this._$Em=null}}requestUpdate(e,t,r,a=!1,s){if(void 0!==e){const n=this.constructor;if(!1===a&&(s=this[e]),r??=n.getPropertyOptions(e),!((r.hasChanged??C)(s,t)||r.useDefault&&r.reflect&&s===this._$Ej?.get(e)&&!this.hasAttribute(n._$Eu(e,r))))return;this.C(e,t,r)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:r,reflect:a,wrapped:s},n){r&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,n??t??this[e]),!0!==s||void 0!==n)||(this._$AL.has(e)||(this.hasUpdated||r||(t=void 0),this._$AL.set(e,t)),!0===a&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,r]of e){const{wrapped:e}=r,a=this[t];!0!==e||this._$AL.has(t)||void 0===a||this.C(t,void 0,r,a)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}}k.elementStyles=[],k.shadowRootOptions={mode:"open"},k[b("elementProperties")]=new Map,k[b("finalized")]=new Map,y?.({ReactiveElement:k}),(m.reactiveElementVersions??=[]).push("2.1.2")},6941(e,t,r){r.a(e,async function(e,a){try{r.d(t,{XC:()=>h,c2:()=>f});var s=r(9270),n=(r(8111),r(1701),r(7642),r(5024),r(1698),r(7254),r(7036),e([s]));s=(n.then?(await n)():n)[0];const i=new Set,o=new Map;let l,c="ltr",d="en";const u="undefined"!=typeof MutationObserver&&"undefined"!=typeof document&&void 0!==document.documentElement;if(u){const v=new MutationObserver(p);c=document.documentElement.dir||"ltr",d=document.documentElement.lang||navigator.language,v.observe(document.documentElement,{attributes:!0,attributeFilter:["dir","lang"]})}function h(...e){e.map(e=>{const t=e.$code.toLowerCase();o.has(t)?o.set(t,Object.assign(Object.assign({},o.get(t)),e)):o.set(t,e),l||(l=e)}),p()}function p(){u&&(c=document.documentElement.dir||"ltr",d=document.documentElement.lang||navigator.language),[...i.keys()].map(e=>{"function"==typeof e.requestUpdate&&e.requestUpdate()})}class f{hostConnected(){i.add(this.host)}hostDisconnected(){i.delete(this.host)}dir(){return`${this.host.dir||c}`.toLowerCase()}lang(){return`${this.host.lang||d}`.toLowerCase()}getTranslationData(e){var t,r;let a;try{a=new Intl.Locale(e.replace(/_/g,"-"))}catch(e){return{locale:void 0,language:"",region:"",primary:void 0,secondary:void 0}}const s=a.language.toLowerCase(),n=null!==(r=null===(t=a.region)||void 0===t?void 0:t.toLowerCase())&&void 0!==r?r:"";return{locale:a,language:s,region:n,primary:o.get(`${s}-${n}`),secondary:o.get(s)}}exists(e,t){var r;const{primary:a,secondary:s}=this.getTranslationData(null!==(r=t.lang)&&void 0!==r?r:this.lang());return t=Object.assign({includeFallback:!1},t),!!(a&&a[e]||s&&s[e]||t.includeFallback&&l&&l[e])}term(e,...t){const{primary:r,secondary:a}=this.getTranslationData(this.lang());let s;if(r&&r[e])s=r[e];else if(a&&a[e])s=a[e];else{if(!l||!l[e])return console.error(`No translation found for: ${String(e)}`),String(e);s=l[e]}return"function"==typeof s?s(...t):s}date(e,t){return e=new Date(e),new Intl.DateTimeFormat(this.lang(),t).format(e)}number(e,t){return e=Number(e),isNaN(e)?"":new Intl.NumberFormat(this.lang(),t).format(e)}relativeTime(e,t,r){return new Intl.RelativeTimeFormat(this.lang(),r).format(e,t)}constructor(e){this.host=e,this.host.addController(this)}}a()}catch(m){a(m)}})},7270(e,t,r){r.d(t,{Rt:()=>i,mY:()=>l,qb:()=>n});var a=r(9174);const{I:s}=a.ge,n=(e,t)=>void 0===t?void 0!==e?._$litType$:e?._$litType$===t,i=e=>void 0===e.strings,o={},l=(e,t=o)=>e._$AH=t},434(e,t,r){r.d(t,{OA:()=>a,WL:()=>n,u$:()=>s});const a={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},s=e=>(...t)=>({_$litDirective$:e,values:t});class n{get _$AU(){return this._$AM._$AU}_$AT(e,t,r){this._$Ct=e,this._$AM=t,this._$Ci=r}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}constructor(e){}}},9174(e,t,r){r.d(t,{JW:()=>A,XX:()=>U,c0:()=>S,ej:()=>M,ge:()=>q,qy:()=>L,s6:()=>E});r(805),r(3525);const a=globalThis,s=e=>e,n=a.trustedTypes,i=n?n.createPolicy("lit-html",{createHTML:e=>e}):void 0,o="$lit$",l=`lit$${Math.random().toFixed(9).slice(2)}$`,c="?"+l,d=`<${c}>`,u=document,h=()=>u.createComment(""),p=e=>null===e||"object"!=typeof e&&"function"!=typeof e,f=Array.isArray,v=e=>f(e)||"function"==typeof e?.[Symbol.iterator],m="[ \t\n\f\r]",g=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,_=/-->/g,y=/>/g,b=RegExp(`>|${m}(?:([^\\s"'>=/]+)(${m}*=${m}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),w=/'/g,C=/"/g,x=/^(?:script|style|textarea|title)$/i,k=e=>(t,...r)=>({_$litType$:e,strings:t,values:r}),L=k(1),A=k(2),M=k(3),S=Symbol.for("lit-noChange"),E=Symbol.for("lit-nothing"),$=new WeakMap,P=u.createTreeWalker(u,129);function I(e,t){if(!f(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==i?i.createHTML(t):t}const T=(e,t)=>{const r=e.length-1,a=[];let s,n=2===t?"<svg>":3===t?"<math>":"",i=g;for(let t=0;t<r;t++){const r=e[t];let c,u,h=-1,p=0;for(;p<r.length&&(i.lastIndex=p,u=i.exec(r),null!==u);)p=i.lastIndex,i===g?"!--"===u[1]?i=_:void 0!==u[1]?i=y:void 0!==u[2]?(x.test(u[2])&&(s=RegExp("</"+u[2],"g")),i=b):void 0!==u[3]&&(i=b):i===b?">"===u[0]?(i=s??g,h=-1):void 0===u[1]?h=-2:(h=i.lastIndex-u[2].length,c=u[1],i=void 0===u[3]?b:'"'===u[3]?C:w):i===C||i===w?i=b:i===_||i===y?i=g:(i=b,s=void 0);const f=i===b&&e[t+1].startsWith("/>")?" ":"";n+=i===g?r+d:h>=0?(a.push(c),r.slice(0,h)+o+r.slice(h)+l+f):r+l+(-2===h?t:f)}return[I(e,n+(e[r]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),a]};class D{static createElement(e,t){const r=u.createElement("template");return r.innerHTML=e,r}constructor({strings:e,_$litType$:t},r){let a;this.parts=[];let s=0,i=0;const d=e.length-1,u=this.parts,[p,f]=T(e,t);if(this.el=D.createElement(p,r),P.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(a=P.nextNode())&&u.length<d;){if(1===a.nodeType){if(a.hasAttributes())for(const e of a.getAttributeNames())if(e.endsWith(o)){const t=f[i++],r=a.getAttribute(e).split(l),n=/([.?@])?(.*)/.exec(t);u.push({type:1,index:s,name:n[2],strings:r,ctor:"."===n[1]?R:"?"===n[1]?O:"@"===n[1]?V:F}),a.removeAttribute(e)}else e.startsWith(l)&&(u.push({type:6,index:s}),a.removeAttribute(e));if(x.test(a.tagName)){const e=a.textContent.split(l),t=e.length-1;if(t>0){a.textContent=n?n.emptyScript:"";for(let r=0;r<t;r++)a.append(e[r],h()),P.nextNode(),u.push({type:2,index:++s});a.append(e[t],h())}}}else if(8===a.nodeType)if(a.data===c)u.push({type:2,index:s});else{let e=-1;for(;-1!==(e=a.data.indexOf(l,e+1));)u.push({type:7,index:s}),e+=l.length-1}s++}}}function z(e,t,r=e,a){if(t===S)return t;let s=void 0!==a?r._$Co?.[a]:r._$Cl;const n=p(t)?void 0:t._$litDirective$;return s?.constructor!==n&&(s?._$AO?.(!1),void 0===n?s=void 0:(s=new n(e),s._$AT(e,r,a)),void 0!==a?(r._$Co??=[])[a]=s:r._$Cl=s),void 0!==s&&(t=z(e,s._$AS(e,t.values),s,a)),t}class N{get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:r}=this._$AD,a=(e?.creationScope??u).importNode(t,!0);P.currentNode=a;let s=P.nextNode(),n=0,i=0,o=r[0];for(;void 0!==o;){if(n===o.index){let t;2===o.type?t=new H(s,s.nextSibling,this,e):1===o.type?t=new o.ctor(s,o.name,o.strings,this,e):6===o.type&&(t=new G(s,this,e)),this._$AV.push(t),o=r[++i]}n!==o?.index&&(s=P.nextNode(),n++)}return P.currentNode=u,a}p(e){let t=0;for(const r of this._$AV)void 0!==r&&(void 0!==r.strings?(r._$AI(e,r,t),t+=r.strings.length-2):r._$AI(e[t])),t++}constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}}class H{get _$AU(){return this._$AM?._$AU??this._$Cv}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=z(this,e,t),p(e)?e===E||null==e||""===e?(this._$AH!==E&&this._$AR(),this._$AH=E):e!==this._$AH&&e!==S&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):v(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==E&&p(this._$AH)?this._$AA.nextSibling.data=e:this.T(u.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:r}=e,a="number"==typeof r?this._$AC(e):(void 0===r.el&&(r.el=D.createElement(I(r.h,r.h[0]),this.options)),r);if(this._$AH?._$AD===a)this._$AH.p(t);else{const e=new N(a,this),r=e.u(this.options);e.p(t),this.T(r),this._$AH=e}}_$AC(e){let t=$.get(e.strings);return void 0===t&&$.set(e.strings,t=new D(e)),t}k(e){f(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let r,a=0;for(const s of e)a===t.length?t.push(r=new H(this.O(h()),this.O(h()),this,this.options)):r=t[a],r._$AI(s),a++;a<t.length&&(this._$AR(r&&r._$AB.nextSibling,a),t.length=a)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=s(e).nextSibling;s(e).remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}constructor(e,t,r,a){this.type=2,this._$AH=E,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=r,this.options=a,this._$Cv=a?.isConnected??!0}}class F{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}_$AI(e,t=this,r,a){const s=this.strings;let n=!1;if(void 0===s)e=z(this,e,t,0),n=!p(e)||e!==this._$AH&&e!==S,n&&(this._$AH=e);else{const a=e;let i,o;for(e=s[0],i=0;i<s.length-1;i++)o=z(this,a[r+i],t,i),o===S&&(o=this._$AH[i]),n||=!p(o)||o!==this._$AH[i],o===E?e=E:e!==E&&(e+=(o??"")+s[i+1]),this._$AH[i]=o}n&&!a&&this.j(e)}j(e){e===E?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}constructor(e,t,r,a,s){this.type=1,this._$AH=E,this._$AN=void 0,this.element=e,this.name=t,this._$AM=a,this.options=s,r.length>2||""!==r[0]||""!==r[1]?(this._$AH=Array(r.length-1).fill(new String),this.strings=r):this._$AH=E}}class R extends F{j(e){this.element[this.name]=e===E?void 0:e}constructor(){super(...arguments),this.type=3}}class O extends F{j(e){this.element.toggleAttribute(this.name,!!e&&e!==E)}constructor(){super(...arguments),this.type=4}}class V extends F{_$AI(e,t=this){if((e=z(this,e,t,0)??E)===S)return;const r=this._$AH,a=e===E&&r!==E||e.capture!==r.capture||e.once!==r.once||e.passive!==r.passive,s=e!==E&&(r===E||a);a&&this.element.removeEventListener(this.name,this,r),s&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}constructor(e,t,r,a,s){super(e,t,r,a,s),this.type=5}}class G{get _$AU(){return this._$AM._$AU}_$AI(e){z(this,e)}constructor(e,t,r){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=r}}const q={M:o,P:l,A:c,C:1,L:T,R:N,D:v,V:z,I:H,H:F,N:O,U:V,B:R,F:G},B=a.litHtmlPolyfillSupport;B?.(D,H),(a.litHtmlVersions??=[]).push("3.3.3");const U=(e,t,r)=>{const a=r?.renderBefore??t;let s=a._$litPart$;if(void 0===s){const e=r?.renderBefore??null;a._$litPart$=s=new H(t.insertBefore(h(),e),e,void 0,r??{})}return s._$AI(e),s}},8292(e,t,r){r.d(t,{EM:()=>a,Ls:()=>c,MZ:()=>o,P:()=>u,nJ:()=>h,wk:()=>l});const a=e=>(t,r)=>{void 0!==r?r.addInitializer(()=>{customElements.define(e,t)}):customElements.define(e,t)};r(7254),r(7036);var s=r(7285);const n={attribute:!0,type:String,converter:s.W3,reflect:!1,hasChanged:s.Ec},i=(e=n,t,r)=>{const{kind:a,metadata:s}=r;let i=globalThis.litPropertyMetadata.get(s);if(void 0===i&&globalThis.litPropertyMetadata.set(s,i=new Map),"setter"===a&&((e=Object.create(e)).wrapped=!0),i.set(r.name,e),"accessor"===a){const{name:a}=r;return{set(r){const s=t.get.call(this);t.set.call(this,r),this.requestUpdate(a,s,e,!0,r)},init(t){return void 0!==t&&this.C(a,void 0,e,t),t}}}if("setter"===a){const{name:a}=r;return function(r){const s=this[a];t.call(this,r),this.requestUpdate(a,s,e,!0,r)}}throw Error("Unsupported decorator location: "+a)};function o(e){return(t,r)=>"object"==typeof r?i(e,t,r):((e,t,r)=>{const a=t.hasOwnProperty(r);return t.constructor.createProperty(r,e),a?Object.getOwnPropertyDescriptor(t,r):void 0})(e,t,r)}function l(e){return o({...e,state:!0,attribute:!1})}function c(e){return(t,r)=>{const a="function"==typeof t?t:t[r];Object.assign(a,e)}}const d=(e,t,r)=>(r.configurable=!0,r.enumerable=!0,Reflect.decorate&&"object"!=typeof t&&Object.defineProperty(e,t,r),r);function u(e,t){return(r,a,s)=>{const n=t=>t.renderRoot?.querySelector(e)??null;if(t){const{get:e,set:t}="object"==typeof a?r:s??(()=>{const e=Symbol();return{get(){return this[e]},set(t){this[e]=t}}})();return d(r,a,{get(){let r=e.call(this);return void 0===r&&(r=n(this),(null!==r||this.hasUpdated)&&t.call(this,r)),r}})}return d(r,a,{get(){return n(this)}})}}function h(e){return(t,r)=>d(t,r,{async get(){return await this.updateComplete,this.renderRoot?.querySelector(e)??null}})}r(8111),r(2489)},6037(e,t,r){r.d(t,{H:()=>n});r(8111),r(2489),r(7642),r(5024),r(1698);var a=r(9174),s=r(434);const n=(0,s.u$)(class extends s.WL{render(e){return" "+Object.keys(e).filter(t=>e[t]).join(" ")+" "}update(e,[t]){if(void 0===this.st){this.st=new Set,void 0!==e.strings&&(this.nt=new Set(e.strings.join(" ").split(/\s/).filter(e=>""!==e)));for(const e in t)t[e]&&!this.nt?.has(e)&&this.st.add(e);return this.render(t)}const r=e.element.classList;for(const e of this.st)e in t||(r.remove(e),this.st.delete(e));for(const e in t){const a=!!t[e];a===this.st.has(e)||this.nt?.has(e)||(a?(r.add(e),this.st.add(e)):(r.remove(e),this.st.delete(e)))}return a.c0}constructor(e){if(super(e),e.type!==s.OA.ATTRIBUTE||"class"!==e.name||e.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}})},5287(e,t,r){r.d(t,{J:()=>s});var a=r(9174);const s=e=>e??a.s6},3153(e,t,r){r.d(t,{W:()=>o});r(4423),r(8111),r(8237),r(7642),r(5024),r(1698);var a=r(9174),s=r(434);const n="important",i=" !"+n,o=(0,s.u$)(class extends s.WL{render(e){return Object.keys(e).reduce((t,r)=>{const a=e[r];return null==a?t:t+`${r=r.includes("-")?r:r.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g,"-$&").toLowerCase()}:${a};`},"")}update(e,[t]){const{style:r}=e.element;if(void 0===this.ft)return this.ft=new Set(Object.keys(t)),this.render(t);for(const e of this.ft)null==t[e]&&(this.ft.delete(e),e.includes("-")?r.removeProperty(e):r[e]=null);for(const e in t){const a=t[e];if(null!=a){this.ft.add(e);const t="string"==typeof a&&a.endsWith(i);e.includes("-")||t?r.setProperty(e,t?a.slice(0,-11):a,t?n:""):r[e]=a}}return a.c0}constructor(e){if(super(e),e.type!==s.OA.ATTRIBUTE||"style"!==e.name||e.strings?.length>2)throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.")}})},7983(e,t,r){r.d(t,{WF:()=>i,AH:()=>a.AH,qy:()=>s.qy,S$:()=>!1,s6:()=>s.s6,JW:()=>s.JW});var a=r(7285),s=r(9174);const n=globalThis;class i extends a.mN{createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=(0,s.XX)(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return s.c0}constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}}i._$litElement$=!0,i.finalized=!0,n.litElementHydrateSupport?.({LitElement:i});const o=n.litElementPolyfillSupport;o?.({LitElement:i});(n.litElementVersions??=[]).push("4.2.2")},2179(e,t,r){r.d(t,{qy:()=>c,eu:()=>i});r(8111),r(8237),r(7254),r(7036);var a=r(9174);const s=Symbol.for(""),n=e=>{if(e?.r===s)return e?._$litStatic$},i=(e,...t)=>({_$litStatic$:t.reduce((t,r,a)=>t+(e=>{if(void 0!==e._$litStatic$)return e._$litStatic$;throw Error(`Value passed to 'literal' function must be a 'literal' result: ${e}. Use 'unsafeStatic' to pass non-literal values, but\n            take care to ensure page security.`)})(r)+e[a+1],e[0]),r:s}),o=new Map,l=e=>(t,...r)=>{const a=r.length;let s,i;const l=[],c=[];let d,u=0,h=!1;for(;u<a;){for(d=t[u];u<a&&void 0!==(i=r[u],s=n(i));)d+=s+t[++u],h=!0;u!==a&&c.push(i),l.push(d),u++}if(u===a&&l.push(t[a]),h){const e=l.join("$$lit$$");void 0===(t=o.get(e))&&(l.raw=l,o.set(e,t=l)),r=c}return e(t,...r)},c=l(a.qy);l(a.JW),l(a.ej)},3609(e,t,r){r.d(t,{Cg:()=>a});r(4113),r(7324),r(8940),r(8111),r(6382),r(452);function a(e,t,r,a){var s,n=arguments.length,i=n<3?t:null===a?a=Object.getOwnPropertyDescriptor(t,r):a;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)i=Reflect.decorate(e,t,r,a);else for(var o=e.length-1;o>=0;o--)(s=e[o])&&(i=(n<3?s(i):n>3?s(t,r,i):s(t,r))||i);return n>3&&i&&Object.defineProperty(t,r,i),i}Object.create;Object.create}},a={};function s(e){var t=a[e];if(void 0!==t)return t.exports;var n=a[e]={exports:{}};return r[e].call(n.exports,n,n.exports,s),n.exports}s.m=r,(()=>{var e="function"==typeof Symbol,t=e?Symbol("rspack queues"):"__rspack_queues",r=s.aE=e?Symbol("rspack exports"):"__webpack_exports__",n=e?Symbol("rspack error"):"__rspack_error",i=e?Symbol("rspack done"):"__rspack_done",o=s.zS=e?Symbol("rspack defer"):"__rspack_defer";s.zT=e=>{if(e.some(e=>{var t=a[e];return!t||!1===t[i]}))return{then:(t,r)=>Promise.all(e.map(s)).then(t,r)}};var l=e=>{e&&e.d<1&&(e.d=1,e.forEach(e=>e.r--),e.forEach(e=>e.r--?e.r++:e()))};s.a=(e,a,c)=>{var d;c&&((d=[]).d=-1);var u,h,p,f=new Set,v=e.exports,m=new Promise((e,t)=>{p=t,h=e});m[r]=v,m[t]=e=>{d&&e(d),f.forEach(e),m.catch(()=>{})},e.exports=m;a(e=>{var a;u=(e=>e.map(e=>{if(null!==e&&"object"==typeof e){if(!e[t]&&e[o]){var a=s.zT(e[o]);if(!a)return e;var i=e;e={then(e,t){a.then(()=>e(i),t)}}}if(e[t])return e;if(e.then){var c=[];c.d=0,e.then(e=>{d[r]=e,l(c)},e=>{d[n]=e,l(c)});var d={};return d[o]=!1,d[t]=e=>e(c),d}}var u={};return u[t]=()=>{},u[r]=e,u}))(e);var i=()=>u.map(e=>{if(e[o])return e;if(e[n])throw e[n];return e[r]}),c=new Promise(e=>{(a=()=>e(i)).r=0;var r=e=>e!==d&&!f.has(e)&&(f.add(e),e&&!e.d&&(a.r++,e.push(a)));u.map(e=>e[o]||e[t](r))});return a.r?c:i()},e=>(e?p(m[n]=e):h(v),l(d),m[i]=!0)),d&&d.d<0&&(d.d=0)}})(),s.n=e=>{var t=e&&e.__esModule?()=>e.default:()=>e;return s.d(t,{a:t}),t},s.d=(e,t)=>{for(var r in t)s.o(t,r)&&!s.o(e,r)&&Object.defineProperty(e,r,{enumerable:!0,get:t[r]})},s.f={},s.e=e=>Promise.all(Object.keys(s.f).reduce((t,r)=>(s.f[r](e,t),t),[])),s.u=e=>e+".js",s.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),s.r=e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},e={entrypoint:0},t=t=>{var r,a,n=t.__rspack_esm_ids,i=t.__webpack_modules__,o=t.__rspack_esm_runtime,l=0;for(r in i)s.o(i,r)&&(s.m[r]=i[r]);for(o&&o(s);l<n.length;l++)a=n[l],s.o(e,a)&&e[a]&&e[a][0](),e[n[l]]=0},s.f.j=function(r,a){var n=s.o(e,r)?e[r]:void 0;if(0!==n)if(n)a.push(n[1]);else{var i=import("./"+s.u(r)).then(t,t=>{throw 0!==e[r]&&(e[r]=void 0),t});i=Promise.race([i,new Promise(t=>{n=e[r]=[t]})]),a.push(n[1]=i)}};s(6084);
//# sourceMappingURL=entrypoint.js.map