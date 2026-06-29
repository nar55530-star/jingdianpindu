import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// POST /api/seed - 初始化种子数据（经典篇目）
export async function POST() {
  const client = getSupabaseClient();

  // 检查是否已有数据
  const { data: existing } = await client.from('articles').select('id').limit(1);
  if (existing && existing.length > 0) {
    return NextResponse.json({ message: '数据已存在，跳过初始化' });
  }

  const articles = [
    {
      title: '星星之火，可以燎原',
      author: '毛泽东',
      description: '1930年1月5日，毛泽东在古田给林彪写的一封信，用以答复他对前途悲观思想的信。信中批评了当时林彪以及党内一些同志对时局估量的悲观思想，指出中国革命高潮快要到来。',
      sort_order: 1,
    },
    {
      title: '论十大关系',
      author: '毛泽东',
      description: '1956年4月25日，毛泽东在中共中央政治局扩大会议上的讲话。讲话总结了我国社会主义建设的经验，提出了调动一切积极因素为社会主义建设服务的基本方针。',
      sort_order: 2,
    },
    {
      title: '在武昌、深圳、珠海、上海等地的谈话要点',
      author: '邓小平',
      description: '1992年初，邓小平视察南方时发表的一系列重要谈话。谈话深刻回答了长期困扰和束缚人们思想的许多重大认识问题，是把改革开放和现代化建设推向新阶段的又一个解放思想、实事求是的宣言书。',
      sort_order: 3,
    },
    {
      title: '在庆祝中国共产党成立八十周年大会上的讲话',
      author: '江泽民',
      description: '2001年7月1日，江泽民在庆祝中国共产党成立80周年大会上的讲话。讲话系统阐述了"三个代表"重要思想，深刻回答了在新的历史条件下建设什么样的党和怎样建设党的问题。',
      sort_order: 4,
    },
    {
      title: '把科学发展观贯穿于发展的整个过程和各个方面',
      author: '胡锦涛',
      description: '2004年5月5日，胡锦涛在江苏考察工作结束时的讲话。讲话深刻阐述了科学发展观的内涵和要求，强调要把科学发展观贯穿于发展的整个过程和各个方面。',
      sort_order: 5,
    },
    {
      title: '在纪念毛泽东同志诞辰130周年座谈会上的讲话',
      author: '习近平',
      description: '2023年12月26日，习近平在纪念毛泽东同志诞辰130周年座谈会上的讲话。讲话高度评价了毛泽东同志的丰功伟绩，强调要把毛泽东同志开创的事业继续推向前进。',
      sort_order: 6,
    },
  ];

  const { data, error } = await client.from('articles').insert(articles).select();

  if (error) {
    return NextResponse.json({ error: `初始化失败: ${error.message}` }, { status: 500 });
  }

  // 创建管理员用户
  const { data: adminData, error: adminError } = await client
    .from('users')
    .insert({ nickname: '管理员', is_admin: true })
    .select()
    .single();

  if (adminError) {
    return NextResponse.json({ error: `创建管理员失败: ${adminError.message}` }, { status: 500 });
  }

  return NextResponse.json({
    message: '初始化成功',
    articles: data,
    admin: adminData,
  });
}
