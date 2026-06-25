BEGIN;

INSERT INTO registrations (
    id, 
    event_id, 
    unstop_team_id, 
    team_name, 
    team_passcode_hash, 
    member_details, 
    progress_state, 
    total_score, 
    registered_at, 
    is_blocked
) VALUES
('095f87db-ad71-4e64-8e83-fe6757238ee0', 5, 'UNSTOP-1027', 'sungandh_gupta', 'sugandh_2502052595', '[{"email":"[sugandh_gupta@test.com](mailto:sugandh_gupta@test.com)"}]'::jsonb, '{"score":0,"stage":1}'::jsonb, 0, '2026-06-25 10:52:41.622', false),
('132455d5-03d4-4373-9e5e-49a6ab518d66', 5, 'UNSTOP-1016', 'paavni_tandon', 'paavni_2502050187', '[{"email":"paavni_tandon@test.com"}]'::jsonb, '{"score":0,"stage":1}'::jsonb, 0, '2026-06-25 09:22:36.506', false),
('15b53b3d-4c54-4280-9868-bea31fd33322', 5, 'UNSTOP-1015', 'prabhnoor_kalsi', 'prabhnoor_2502052493', '[{"email":"prabhnoor_kaur@test.com"}]'::jsonb, '{"score":0,"stage":1}'::jsonb, 0, '2026-06-25 09:22:36.501', false),
('166a1623-2562-40b4-99ab-b311fe97aea2', 5, 'UNSTOP-1019', 'sagar_singh', 'sagar_2502051093', '[{"email":"sagar_singh@test.com"}]'::jsonb, '{"score":0,"stage":1}'::jsonb, 0, '2026-06-25 09:22:36.523', false),
('26c2268a-0156-45af-8e77-1f9a0074808f', 5, 'UNSTOP-1021', 'rishit_sethi', 'sh3ll3r_p@ssw0rd', '[{"email":"sheller@test.com"}]'::jsonb, '{"score":0,"stage":1}'::jsonb, 0, '2026-06-25 09:22:36.535', false),
('27d834fc-09c2-4eb0-8343-286028b07d22', 5, 'UNSTOP-1013', 'anshika_agarwal', 'anshika_2503120016', '[{"email":"anshika_agarwal@test.com"}]'::jsonb, '{"score":0,"stage":1}'::jsonb, 0, '2026-06-25 09:22:36.489', false),
('34256f53-d03c-4c71-84bb-87f41661b1f7', 5, 'UNSTOP-1012', 'diksha_khaitan', 'diksha_2502052626', '[{"email":"diksha_khaitan@test.com"}]'::jsonb, '{"score":0,"stage":1}'::jsonb, 0, '2026-06-25 09:22:36.483', false),
('3f74fa54-8fba-446d-8cba-47216349ba77', 5, 'UNSTOP-1028', 'dipayan_basu', 'dipayan_2502052596', '[{"email":"[dipayan_basu@test.com](mailto:dipayan_basu@test.com)"}]'::jsonb, '{"score":0,"stage":1}'::jsonb, 0, '2026-06-25 10:52:41.628', false),
('44882379-a84b-40a5-be96-22f8d8944860', 5, 'UNSTOP-1007', 'aryan_sahu', 'aryan_2503080247', '[{"email":"aryan_sahu@test.com"}]'::jsonb, '{"score":0,"stage":1}'::jsonb, 0, '2026-06-25 09:22:36.456', false),
('48c4dcda-2149-4db5-9781-cb0b9ec65e1a', 5, 'UNSTOP-1024', 'abhinav_chauhan', 'abhinav_2502052522', '[{"email":"[abhinav_chauhan@test.com](mailto:abhinav_chauhan@test.com)"}]'::jsonb, '{"score":0,"stage":1}'::jsonb, 0, '2026-06-25 10:52:41.605', false),
('5c54a384-3ef2-482d-ba7b-8396167b1747', 5, 'UNSTOP-1022', 'avleen_kaur_saini', 'avleen_2503120051', '[{"email":"avleen_kaur_saini@test.com"}]'::jsonb, '{"score":0,"stage":1}'::jsonb, 0, '2026-06-25 10:52:41.582', false),
('63a10394-3ade-4749-bc91-692ae36888b3', 5, 'UNSTOP-1026', 'anant_dev_singh', 'anant_2503110031', '[{"email":"[anant_dev_singh@test.com](mailto:anant_dev_singh@test.com)"}]'::jsonb, '{"score":0,"stage":1}'::jsonb, 0, '2026-06-25 10:52:41.618', false),
('6bb3594a-dd6e-4903-883b-6bfea5374fa6', 5, 'UNSTOP-1011', 'alekhya_mazumdar', 'alekhya_2502052554', '[{"email":"alekhya_mazumdar@test.com"}]'::jsonb, '{"score":0,"stage":1}'::jsonb, 0, '2026-06-25 09:22:36.478', false),
('7a3968f4-5c8d-416b-be34-f34fcb77b773', 5, 'UNSTOP-1003', 'aarushi_singh', 'aarushi_2502052210', '[{"email":"aarushi_singh@test.com"}]'::jsonb, '{"score":0,"stage":1}'::jsonb, 0, '2026-06-25 09:22:36.432', false),
('89693163-5738-4f15-88a8-5ee5f311a6c1', 5, 'UNSTOP-1001', 'naveen_kant', 'naveen_2502052513', '[{"email":"naveen_kant@test.com"}]'::jsonb, '{"score":0,"stage":1}'::jsonb, 0, '2026-06-25 09:22:36.413', false),
('95b0a97c-bb50-4b42-9df8-150b152f49da', 5, 'UNSTOP-1005', 'mihika_mathur', 'mihika_2502050120', '[{"email":"mihika_mathur@test.com"}]'::jsonb, '{"score":0,"stage":1}'::jsonb, 0, '2026-06-25 09:22:36.444', false),
('9c80226c-f999-4d28-b933-ea59ccbaf474', 5, 'UNSTOP-1006', 'tanisha_vaidya', 'tanisha_2503030054', '[{"email":"tanisha_vaidya@test.com"}]'::jsonb, '{"score":0,"stage":1}'::jsonb, 0, '2026-06-25 09:22:36.45', false),
('ade641bb-a7ad-4cf2-9036-4adc28c2c1f5', 5, 'UNSTOP-1004', 'yashasvi_pandey', 'yashasvi_2502052460', '[{"email":"yashasvi_pandey@test.com"}]'::jsonb, '{"score":0,"stage":1}'::jsonb, 0, '2026-06-25 09:22:36.438', false),
('b3f0e21b-c6ad-41aa-8700-dd66db3263ee', 5, 'UNSTOP-1014', 'juhi_viramgama', 'viramgama_2502051613', '[{"email":"juhi_viramgama@test.com"}]'::jsonb, '{"score":0,"stage":1}'::jsonb, 0, '2026-06-25 09:22:36.495', false),
('b5e0df16-97e3-4ed9-8fc0-11a8462d2575', 5, 'UNSTOP-1030', 'yashovardhan_ha', 'yashovardhan_2502050906', '[{"email":"[yashovardhan_jha@test.com](mailto:yashovardhan_jha@test.com)"}]'::jsonb, '{"score":0,"stage":1}'::jsonb, 0, '2026-06-25 11:34:20.207', false),
('beb02626-b359-455c-9aef-13d97969cc5f', 5, 'UNSTOP-1017', 'kanishk_bhattacharya', 'kanishk_2503130050', '[{"email":"kanishk_bhattacharya@test.com"}]'::jsonb, '{"score":0,"stage":1}'::jsonb, 0, '2026-06-25 09:22:36.512', false),
('c592a544-d80a-4edc-80e3-64cfc2489931', 5, 'UNSTOP-1018', 'iha_singh', 'iha_2503030021', '[{"email":"iha_singh@test.com"}]'::jsonb, '{"score":0,"stage":1}'::jsonb, 0, '2026-06-25 09:22:36.517', false),
('cdcd14cf-a895-4cb4-9f3a-3cb440a084f5', 5, 'UNSTOP-1002', 'aarushi_bansal', 'aarushi_2502050997', '[{"email":"aarushi_bansal@test.com"}]'::jsonb, '{"score":0,"stage":1}'::jsonb, 0, '2026-06-25 09:22:36.426', false),
('d53722ef-4c8b-4422-afbe-54a9bf593cec', 5, 'UNSTOP-1008', 'eshaan_sharma', 'eshaan_2503090045', '[{"email":"eshaan_sharma@test.com"}]'::jsonb, '{"score":0,"stage":1}'::jsonb, 0, '2026-06-25 09:22:36.462', false),
('d9efac67-d0f6-4f4f-9184-cf5ff315ca5a', 5, 'UNSTOP-1023', 'anvit_nikhilesh_deshpande', 'anvit_2503120049', '[{"email":"[anvit_nikhilesh_deshpande@test.com](mailto:anvit_nikhilesh_deshpande@test.com)"}]'::jsonb, '{"score":0,"stage":1}'::jsonb, 0, '2026-06-25 10:52:41.6', false),
('df894b02-1922-4083-9b58-71900892fe26', 5, 'UNSTOP-1029', 'snehal_sinha', 'snehal_2502052417', '[{"email":"[snehal_sinha@test.com](mailto:snehal_sinha@test.com)"}]'::jsonb, '{"score":0,"stage":1}'::jsonb, 0, '2026-06-25 10:52:41.633', false),
('dfa13dfb-bd10-4465-a3cb-6cad132a414a', 5, 'UNSTOP-1031', 'aarush_srivastav', 'aarush_2502052285', '[{"email":"[aarush_srivastav@test.com](mailto:aarush_srivastav@test.com)"}]'::jsonb, '{"score":0,"stage":1}'::jsonb, 0, '2026-06-25 11:34:20.215', false),
('e474ebe6-bd45-48e1-ba2f-14b4168f54ff', 5, 'UNSTOP-1009', 'ritika_singh', 'ritika_2503080075', '[{"email":"ritika_singh@test.com"}]'::jsonb, '{"score":0,"stage":1}'::jsonb, 0, '2026-06-25 09:22:36.467', false),
('e98fc930-c37a-4cea-813c-284c487157c2', 5, 'UNSTOP-1025', 'samridhi_choraria', 'samridhi_2503120054', '[{"email":"[samridhi_choraria@test.com](mailto:samridhi_choraria@test.com)"}]'::jsonb, '{"score":0,"stage":1}'::jsonb, 0, '2026-06-25 10:52:41.611', false),
('fa89c045-749c-4df7-9d1c-05515e1a2252', 5, 'UNSTOP-1010', 'jaagriti_sethia', 'jaagriti_2503110038', '[{"email":"jaagriti_sethia@test.com"}]'::jsonb, '{"score":0,"stage":1}'::jsonb, 0, '2026-06-25 09:22:36.473', false),
('ff4c49fa-7cbd-4c2d-8156-ce7484136e25', 5, 'UNSTOP-1020', 'avni_sankhare', 'avni_2503080128', '[{"email":"avni_sankhare@test.com"}]'::jsonb, '{"score":0,"stage":1}'::jsonb, 0, '2026-06-25 09:22:36.528', false)
ON CONFLICT (id) DO NOTHING;

COMMIT;
