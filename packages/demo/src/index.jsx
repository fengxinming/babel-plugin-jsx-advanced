import React, { useState } from 'react';

function IfTag() {
  const statement = useState(false);
  return (
    <if value={statement}>
      <h2>标题1</h2>
      <p>内容1</p>
    </if>
  );
}

function IfAttr() {
  const statement = useState(1);
  return (
    <>
      <button x-if={statement === 1} type="button">新增</button>
      <button x-elif={statement === 2} type="button">删除</button>
      <button x-elif={statement === 3} type="button">修改</button>
      <button x-else type="button" disabled>禁用</button>
    </>
  );
}

function ClassAttr() {
  const statement = useState(false);
  return (
    <button
      x-class={{
        primary: statement,
        default: statement
      }}
      type="button"
    >
      新增
    </button>
  );
}


function ShowAttr() {
  const statement = useState(false);
  return (
    <button x-show={statement} type="button">新增</button>
  );
}

function HtmlAttr() {
  const statement = useState('<span>hello</span>');
  return (
    <div x-html={statement} />
  );
}


export default function () {
  return (
    <div>
      <IfTag />
      <IfAttr />
      <ClassAttr />
      <ShowAttr />
      <HtmlAttr />
    </div>
  );
}
