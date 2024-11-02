-- -> Event -> Itemwise -> Volunteer - > Slotwise
SELECT
    (
        SELECT
            event_name
        FROM
            category_events ce
        WHERE
            ce.id = event_id
    ) AS event_name,
    (
        SELECT
            item_name
        FROM
            event_items ei
        WHERE
            ei.id = event_item_id
    ) AS sub_event_name,
    CASE
        WHEN trx_ts >= 1702618200
        AND trx_ts <= 1702661400 THEN '1 - 15th evening'
        WHEN trx_ts >= 1702701000
        AND trx_ts <= 1702715399 THEN '2 - 16th 10am-2pm'
        WHEN trx_ts >= 1702715400
        AND trx_ts <= 1702726199 THEN '3 - 16th 2pm-5pm'
        WHEN trx_ts >= 1702726200
        AND trx_ts <= 1702744200 THEN '4 - 16th 5pm-end'
        ELSE 'unknown'
    END AS slot_number,
    CASE
        WHEN trx_ts >= 1702618200
        AND trx_ts <= 1702661400 THEN '1 - 15th evening'
        WHEN trx_ts >= 1702701000
        AND trx_ts <= 1702715399 THEN '2 - 16th 10am-2pm'
        WHEN trx_ts >= 1702715400
        AND trx_ts <= 1702726199 THEN '3 - 16th 2pm-5pm'
        WHEN trx_ts >= 1702726200
        AND trx_ts <= 1702744200 THEN '4 - 16th 5pm-end'
        ELSE 'unknown'
    END AS slot_number,
    (
        SELECT
            CONCAT(firstname, ' ', lastname)
        FROM
            users u
        WHERE
            u.id = volunteer_id
    ) AS name,
    -- volunteer_id,
    ABS(SUM(trx_amount)) AS collection
FROM
    `transaction_log` tl
WHERE
    notes = 'payment'
AND log_ref_id IS NULL
GROUP BY
    event_id,
    event_item_id,
    slot_number,
    volunteer_id
ORDER BY
    event_name ASC,
    sub_event_name ASC,
    slot_number ASC,
    name ASC;




-- Volunteer -> Event -> Itemwise -> Slotwise
SELECT
    (
        SELECT
            CONCAT(firstname, ' ', lastname)
        FROM
            users u
        WHERE
            u.id = volunteer_id
    ) AS name,
    -- volunteer_id,
    (
        SELECT
            event_name
        FROM
            category_events ce
        WHERE
            ce.id = event_id
    ) AS event_name,
    (
        SELECT
            item_name
        FROM
            event_items ei
        WHERE
            ei.id = event_item_id
    ) AS sub_event_name,
    IFNULL((
    SELECT
        item_name
    FROM
        event_items ei
    WHERE
        ei.id = event_item_id
),(
    SELECT
        event_name
    FROM
        category_events ce
    WHERE
        ce.id = event_id
)) AS event_item_name,
    CASE
        WHEN trx_ts >= 1702618200
        AND trx_ts <= 1702661400 THEN '1 - 15th evening'
        WHEN trx_ts >= 1702701000
        AND trx_ts <= 1702715399 THEN '2 - 16th 10am-2pm'
        WHEN trx_ts >= 1702715400
        AND trx_ts <= 1702726199 THEN '3 - 16th 2pm-5pm'
        WHEN trx_ts >= 1702726200
        AND trx_ts <= 1702744200 THEN '4 - 16th 5pm-end'
        ELSE 'unknown'
    END AS slot_number,
    ABS(SUM(trx_amount)) AS collection
FROM
    `transaction_log` tl
WHERE
    notes = 'payment'
AND log_ref_id IS NULL
GROUP BY
    volunteer_id,
    -- event_id,
    event_item_name,
    slot_number
ORDER BY
    name ASC,
    event_name ASC,
    sub_event_name ASC,
    slot_number ASC;




-- Volunteer -> Slotwise -> Event -> Itemwise
SELECT
    (
        SELECT
            CONCAT(firstname, ' ', lastname)
        FROM
            users u
        WHERE
            u.id = volunteer_id
    ) AS name,
    -- volunteer_id,
    CASE
        WHEN trx_ts >= 1702618200
        AND trx_ts <= 1702661400 THEN '1 - 15th evening'
        WHEN trx_ts >= 1702701000
        AND trx_ts <= 1702715399 THEN '2 - 16th 10am-2pm'
        WHEN trx_ts >= 1702715400
        AND trx_ts <= 1702726199 THEN '3 - 16th 2pm-5pm'
        WHEN trx_ts >= 1702726200
        AND trx_ts <= 1702744200 THEN '4 - 16th 5pm-end'
        ELSE 'unknown'
    END AS slot_number,
    (
        SELECT
            event_name
        FROM
            category_events ce
        WHERE
            ce.id = event_id
    ) AS event_name,
    (
        SELECT
            item_name
        FROM
            event_items ei
        WHERE
            ei.id = event_item_id
    ) AS sub_event_name,
    ABS(SUM(trx_amount)) AS collection
FROM
    `transaction_log` tl
WHERE
    notes = 'payment'
AND log_ref_id IS NULL
GROUP BY
    volunteer_id,
    slot_number,
    event_id,
    event_item_id
ORDER BY
    name ASC,
    slot_number ASC,
    event_name ASC,
    sub_event_name ASC;


-- -> Event -> Itemwise - > Slotwise
SELECT
    (
        SELECT
            event_name
        FROM
            category_events ce
        WHERE
            ce.id = event_id
    ) AS event_name,
    (
        SELECT
            item_name
        FROM
            event_items ei
        WHERE
            ei.id = event_item_id
    ) AS sub_event_name,
    CASE
        WHEN trx_ts >= 1702618200
        AND trx_ts <= 1702661400 THEN '1 - 15th evening'
        WHEN trx_ts >= 1702701000
        AND trx_ts <= 1702715399 THEN '2 - 16th 10am-2pm'
        WHEN trx_ts >= 1702715400
        AND trx_ts <= 1702726199 THEN '3 - 16th 2pm-5pm'
        WHEN trx_ts >= 1702726200
        AND trx_ts <= 1702744200 THEN '4 - 16th 5pm-end'
        ELSE 'unknown'
    END AS slot_number,
    -- (
    --     SELECT
    --         CONCAT(firstname, ' ', lastname)
    --     FROM
    --         users u
    --     WHERE
    --         u.id = volunteer_id
    -- ) AS name,
    -- volunteer_id,
    ABS(SUM(trx_amount)) AS collection
FROM
    `transaction_log` tl
WHERE
    notes = 'payment'
AND log_ref_id IS NULL
GROUP BY
    event_id,
    event_item_id,
    slot_number
ORDER BY
    event_name ASC,
    sub_event_name ASC,
    slot_number ASC;

-- -> Event -> Itemwise
SELECT
    (
        SELECT
            event_name
        FROM
            category_events ce
        WHERE
            ce.id = event_id
    ) AS event_name,
    (
        SELECT
            item_name
        FROM
            event_items ei
        WHERE
            ei.id = event_item_id
    ) AS sub_event_name,
    ABS(SUM(trx_amount)) AS collection,
    (ABS(SUM(trx_amount))/(
    SELECT
        price
    FROM
        event_items ei
    WHERE
        ei.id = event_item_id
    ))   AS item_count

FROM
    `transaction_log` tl
WHERE
    notes = 'payment'
    AND log_ref_id IS NULL
GROUP BY
    event_id,
    event_item_id
ORDER BY
    event_name ASC,
    sub_event_name ASC

-- trx_type -> Slotwise

SELECT
    notes AS trx_type,
    CASE
        WHEN trx_ts >= 1702618200
        AND trx_ts <= 1702661400 THEN '1 - 15th evening'
        WHEN trx_ts >= 1702701000
        AND trx_ts <= 1702715399 THEN '2 - 16th 10am-2pm'
        WHEN trx_ts >= 1702715400
        AND trx_ts <= 1702726199 THEN '3 - 16th 2pm-5pm'
        WHEN trx_ts >= 1702726200
        AND trx_ts <= 1702744200 THEN '4 - 16th 5pm-end'
        ELSE 'unknown'
    END AS slot_number,
    ABS(SUM(trx_amount)) AS total_trx_amout
FROM
    `transaction_log` tl
WHERE
    notes != 'payment'

GROUP BY
    trx_type,
    slot_number
HAVING
    total_trx_amout != 0
ORDER BY
    trx_type ASC,
    slot_number ASC;



-- trx_type_full -> Slotwise
SELECT
    notes AS trx_type,
    CASE
        WHEN trx_ts >= 1702618200
        AND trx_ts <= 1702661400 THEN '1 - 15th evening'
        WHEN trx_ts >= 1702701000
        AND trx_ts <= 1702715399 THEN '2 - 16th 10am-2pm'
        WHEN trx_ts >= 1702715400
        AND trx_ts <= 1702726199 THEN '3 - 16th 2pm-5pm'
        WHEN trx_ts >= 1702726200
        AND trx_ts <= 1702744200 THEN '4 - 16th 5pm-end'
        ELSE 'unknown'
    END AS slot_number,
    ABS(SUM(trx_amount)) AS total_trx_amout
FROM
    `transaction_log` tl
GROUP BY
    trx_type,
    slot_number
HAVING
    total_trx_amout != 0
ORDER BY
    trx_type ASC,
    slot_number ASC;

-- Unused Recharge
SELECT visitor_id, ABS(SUM(trx_amount)) AS total_recharge FROM `transaction_log`  GROUP BY visitor_id HAVING total_recharge != 0;


-- -> Event -> Itemwise -> Volunteer - > Slotwise - > puppetshows
SELECT
    (
        SELECT
            event_name
        FROM
            category_events ce
        WHERE
            ce.id = event_id
    ) AS event_name,
    (
        SELECT
            category_id
        FROM
            category_events ce
        WHERE
            ce.id = event_id
    ) AS category_id,
    (
        SELECT
            item_name
        FROM
            event_items ei
        WHERE
            ei.id = event_item_id
    ) AS sub_event_name,
    CASE
        WHEN trx_ts >= 1702618200
        AND trx_ts <= 1702661400 THEN '1 - 15th evening'
        WHEN trx_ts >= 1702701000
        AND trx_ts <= 1702715399 THEN '2 - 16th 10am-2pm'
        WHEN trx_ts >= 1702715400
        AND trx_ts <= 1702726199 THEN '3 - 16th 2pm-5pm'
        WHEN trx_ts >= 1702726200
        AND trx_ts <= 1702744200 THEN '4 - 16th 5pm-end'
        ELSE 'unknown'
    END AS slot_number,
    CASE
        WHEN trx_ts >= 1702618200
        AND trx_ts < 1702638600 THEN '15th-4:30pm'
        WHEN trx_ts >= 1702638600
        AND trx_ts < 1702640400 THEN '15th-5:00pm'
        WHEN trx_ts >= 1702640400
        AND trx_ts < 1702642200 THEN '15th-5:30pm'
        WHEN trx_ts >= 1702642200
        AND trx_ts < 1702644000 THEN '15th-6:00pm'
        WHEN trx_ts >= 1702644000
        AND trx_ts < 1702654200 THEN '15th-6:30pm'
        WHEN trx_ts >= 1702702800
        AND trx_ts < 1702707000 THEN '16th-11:30am'
        WHEN trx_ts >= 1702707000
        AND trx_ts < 1702708800 THEN '16th-12:00pm'
        WHEN trx_ts >= 1702708800
        AND trx_ts < 1702710600 THEN '16th-12:30pm'
        WHEN trx_ts >= 1702710600
        AND trx_ts < 1702712400 THEN '16th-1:00pm'
        WHEN trx_ts >= 1702712400
        AND trx_ts < 1702714200 THEN '16th-1:30pm'
        WHEN trx_ts >= 1702714200
        AND trx_ts < 1702716000 THEN '16th-2:00pm'
        WHEN trx_ts >= 1702716000
        AND trx_ts < 1702717800 THEN '16th-2:30pm'
        WHEN trx_ts >= 1702717800
        AND trx_ts < 1702719600 THEN '16th-3:00pm'
        WHEN trx_ts >= 1702719600
        AND trx_ts < 1702721400 THEN '16th-3:30pm'
        WHEN trx_ts >= 1702721400
        AND trx_ts < 1702723200 THEN '16th-4:00pm'
        WHEN trx_ts >= 1702723200
        AND trx_ts < 1702725000 THEN '16th-4:30pm'
        WHEN trx_ts >= 1702725000
        AND trx_ts < 1702726800 THEN '16th-5:00pm'
        WHEN trx_ts >= 1702726800
        AND trx_ts < 1702728600 THEN '16th-5:30pm'
        WHEN trx_ts >= 1702728600
        AND trx_ts < 1702730400 THEN '16th-6:00pm'
        WHEN trx_ts >= 1702730400
        AND trx_ts < 1702742200 THEN '16th-6:30pm'
        ELSE 'unknown'
    END AS show_timings,
    (
        SELECT
            CONCAT(firstname, ' ', lastname)
        FROM
            users u
        WHERE
            u.id = volunteer_id
    ) AS name,
    -- volunteer_id,
    ABS(SUM(trx_amount)) AS collection
FROM
    `transaction_log` tl
WHERE
    notes = 'payment'
    AND log_ref_id IS NULL
GROUP BY
    event_id,
    event_item_id,
    slot_number,
    show_timings,
    volunteer_id
HAVING
    category_id = 7
ORDER BY
    event_name ASC,
    sub_event_name ASC,
    slot_number ASC,
    show_timings ASC,
    name ASC


-- Mosaic
SELECT
    (
        SELECT
            event_name
        FROM
            category_events ce
        WHERE
            ce.id = event_id
    ) AS event_name,
    (
        SELECT
            item_name
        FROM
            event_items ei
        WHERE
            ei.id = event_item_id
    ) AS sub_event_name,
    (
        SELECT
            price
        FROM
            event_items ei
        WHERE
            ei.id = event_item_id
    ) AS item_price,
    trx_ts,
    volunteer_id,
    (
        SELECT
            CONCAT(firstname, ' ', lastname)
        FROM
            users
        WHERE
            id = volunteer_id
    ) AS volunteer_name,
    FROM_UNIXTIME(trx_ts + 5.5 * 60 * 60, '%Y-%m-%d %H:%i:%s') AS trx_datetime,
    ABS(trx_amount) AS trx_amount,
    (
        ABS(trx_amount) /(
            SELECT
                price
            FROM
                event_items ei
            WHERE
                ei.id = event_item_id
        )
    ) AS units
FROM
    `transaction_log` tl
WHERE
    notes = 'payment'
    AND log_ref_id IS NULL
    AND event_id = 46
ORDER BY
    trx_ts ASC
