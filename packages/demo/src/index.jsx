import React from 'react';

function ForAttr({ items }) {
  return (
    <ul>
      <li x-for={(item, index) in items} key={index}>
        {item}
      </li>
      <li x-for={(v, k) in 5} key={k} x-if={k > 3}>{v}</li>
    </ul>
  );
}

function IfAttr({ role }) {
  return (
    <>
      <button type="button">新增</button>
      <button type="button">编辑</button>
      <button x-if={role === 'admin'} type="button">删除</button>
    </>
  );
}

function ElifAttr({ status }) {
  return (
    <>
      <span x-if={status === 0}>初始化</span>
      <span x-elif={status === 1}>准备中</span>
      <span x-elif={status === 2}>发送中</span>
      <span x-elif={status === 3}>接收中</span>
      <span x-elif={status === 3}>完成</span>
      <span x-else>
        异常&nbsp;&nbsp;
        <a href>重试</a>
      </span>
    </>
  );
}

function ElseAttr({ role, items }) {
  return (
    <>
      <table x-if={role === 'admin'}>
        <thead />
        <tbody>
          <tr x-for={(item, index) in items} key={index}>
            <td>{item}</td>
          </tr>
        </tbody>
      </table>
      <p x-else>
        无权限访问
      </p>
    </>
  );
}

function ClassAttr({ status, text }) {
  return (
    <>
      <p
        x-class={{
          default: !status,
          success: status === 1,
          error: status === 2,
          warning: status === 3
        }}
      >
        {text}
      </p>
      <p
        x-class={['info', {
          default: !status,
          success: status === 1,
          error: status === 2,
          warning: status === 3
        }]}
      >
        {text}
      </p>
    </>
  );
}


function ShowAttr({ isShown }) {
  return (
    <p x-show={isShown}>
      内容1
    </p>
  );
}

function HtmlAttr({ html }) {
  if (!html) {
    html = '<span>hello</span>';
  }
  return (
    <p x-html={html} />
  );
}

function IfTag({ role }) {
  return (
    <>
      <button type="button">查看</button>
      <if value={role === 'admin'}>
        <button type="button">新增</button>
        <button type="button">编辑</button>
        <button type="button">删除</button>
      </if>
    </>
  );
}

function ElifTag({ type }) {
  return (
    <form>
      <if value={type === 1}>
        <input placeholder="用户名" />
        <input placeholder="密码" />
      </if>
      <elif value={type === 2}>
        <input placeholder="用户名" />
        <input placeholder="验证码" />
        <a href>获取验证码</a>
      </elif>
      <elif value={type === 3}>
        <img src="" alt="扫码登录" />
      </elif>
    </form>
  );
}

function ElseTag({ role, items }) {
  return (
    <>
      <if value={role === 'admin'}>
        <div>
          <input />
          <button type="button">查询</button>
          <table>
            <thead />
            <tbody>
              <tr x-for={(item, index) in items} key={index}>
                <td>{item}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </if>
      <else>
        无权限访问
      </else>
    </>
  );
}

export default function () {
  return (
    <div>
      <ForAttr />
      <IfAttr />
      <ElifAttr />
      <ElseAttr />
      <ClassAttr />
      <ShowAttr />
      <HtmlAttr />
      <IfTag />
      <ElifTag />
      <ElseTag />
    </div>
  );
}
