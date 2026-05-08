-- 更新所有"学生"分类为"学生科研"
UPDATE industry_reports 
SET category = '学生科研' 
WHERE category = '学生';
