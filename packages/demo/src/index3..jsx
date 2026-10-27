import React, { useState } from 'react';

export function IfTag() {
  const state = useState(false);
  return (
    <div>
      <if value={state > 1}>
        <input name="num" />
        <button type="button">购买</button>
        <if value={state === 1}>
          <button type="button">取消</button>
        </if>
      </if>
    </div>
  );
}

export function IfElseTag() {
  const state = useState(false);
  return (
    <div>
      <if value={state === 1}>
        <input name="num" />
        <button type="button">购买</button>
      </if>
      <elif value={state === 2}>
        <div>内容1</div>
        <div>内容2</div>
        <div>内容3</div>
      </elif>
      <else>
        警告
      </else>
    </div>
  );
}

export function ForAttr({ items }) {
  return (
    <ul>
      <li x-for={(item, index) in items} key={index}>
        {item}
      </li>
    </ul>
  );
}

export function IfAttr() {
  const state = useState(false);
  return (
    <div>
      <button x-if={state === 1}>新增</button>
    </div>
  );
}

export function IfElseAttr() {
  const state = useState(false);
  return (
    <div>
      <span x-if={state === 1}>处理中</span>
      <span x-elif={state === 2}>处理完成</span>
      <span x-else>状态异常</span>
    </div>
  );
}

export function IfTagAttr() {
  const statement = useState(false);
  const another = useState(false);
  return (
    <div>
      <if value={statement}>
        <div>if tag</div>
      </if>
      <elif value={another}>
        <div>else if tag</div>
        <div x-if={statement}>nest if</div>
        <div x-elif={another}>nest else if</div>
      </elif>
    </div>
  );
}

export function ClassAttr() {
  const state = useState(false);
  return (
    <div>
      <div x-class={{
        red: state === 1,
        green: state === 2,
        blue: state === 3
      }}
      >
      </div>
      <div x-class={['red', 'green', 'blue']} />
    </div>
  );
}

export function ShowAttr() {
  const state = useState(false);
  return (
    <div>
      <p x-show={state === 1}>
        内容1
      </p>
    </div>
  );
}

export function HtmlAttr() {
  const html = useState('');
  return (
    <div x-html={html} />
  );
}

// export function ItextTag() {
//   return (
//     <div>
//       <button type="button">
//         <itext name="iot.console.lv.add" fallback="新增" />
//       </button>
//       <input type="button" value={<itext name="iot.console.lv.delete" fallback="删除" />} />
//       <span>
//         <itext date={new Date()} />
//       </span>
//     </div>
//   );
// }

export function Test(props) {
  const statement = useState(false);
  const another = useState(false);
  const arr = useState([1, 2, 3]);
  return (
    <div
      {...props}
      x-if={statement}
      id="div1"
      name="name1"
      x-class={{ foo: false }}
      className="container"
    >
      <div x-show={statement} x-class={{ foo: true }}></div>
      <div style={{ margin: '10px' }} x-show={statement}>
        <div x-show={statement}>
          <span x-class={{ foo: true }}></span>
        </div>
      </div>
      <div x-if={statement} className="foo">only if</div>
      <div x-if={statement}>start if</div>
      {/* 注释 */}
      <div x-elif={another}>start else if</div>
      <div x-else>end else</div>
      <div x-if={statement}>
        start if
        <div x-if={statement}>nest if</div>
        <div x-elif={another}>nest else if</div>
      </div>
      <div x-elif={another}>start else if</div>
      <div x-else>end else</div>
      <if value={statement}>
        if tag
      </if>
      <if value={statement}>
        {statement}
      </if>
      <if value={statement}>if tag</if>
      <if value={statement}><div>if tag</div></if>
      <if value={statement}>
        <div>if tag</div>
      </if>
      {/* 注释 */}
      <elif value={another}>
        <div>else if tag</div>
        <div x-if={statement}>nest if</div>
        <div x-elif={another}>nest else if</div>
      </elif>
      <if value={statement}>
        if tag
      </if>
      <if value={statement}>
        <div>if tag</div>
      </if>
      <elif value={another}>
        <div>else if tag</div>
      </elif>
      <else>
        <div>else tag</div>
      </else>
      <div x-show={statement} x-class={{ foo: true }} x-html="<div>inner html</div>"></div>
      <div x-html={another}></div>
      {/* <itext x-if={statement} name="iot.console.lv.add" zh="新增"></itext> */}
      <ul>
        <li x-for={(item, key) in arr} key={key}>
          {item}
        </li>
        <li x-for={i in 5} key={i} x-if={i > 2}></li>
      </ul>
    </div>
  );
}
