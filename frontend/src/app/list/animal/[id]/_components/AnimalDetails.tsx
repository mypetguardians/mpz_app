import React from "react";

interface AnimalDetailsProps {
  announceNumber: string;
  noticeStartDate: string;
  noticeEndDate: string;
  description: string;
  foundLocation: string;
  center: string;
  isCenterSubscriber?: boolean;
  specialNotes?: string;
  healthNotes?: string[];
}

export default function AnimalDetails({
  announceNumber,
  noticeStartDate,
  noticeEndDate,
  description,
  foundLocation,
  center,
  isCenterSubscriber = false,
  specialNotes,
  healthNotes = [],
}: AnimalDetailsProps) {
  console.log(noticeStartDate, noticeEndDate);

  return (
    <div className="bg-white rounded-lg mx-4">
      <table className="w-full text-sm">
        <tbody>
          {!isCenterSubscriber && (
            <>
              <tr className="h-8">
                <td className="text-gr h5 py-1 pr-3 align-top w-24">
                  공고번호
                </td>
                <td className="text-sm py-1">
                  <div>{announceNumber ? announceNumber : "-"}</div>
                </td>
              </tr>
              <tr className="h-8">
                <td className="text-gr h5 py-1 pr-3 align-top w-24">
                  공고기간
                </td>
                <td className="text-sm py-1">
                  <div>
                    {noticeStartDate && noticeEndDate
                      ? `${noticeStartDate} ~ ${noticeEndDate}`
                      : "-"}
                  </div>
                </td>
              </tr>
            </>
          )}
          {isCenterSubscriber && (
            <>
              {specialNotes && (
                <tr className="h-8">
                  <td className="text-gr h5 py-1 pr-3 align-top w-24">
                    특이사항
                  </td>
                  <td className="text-sm py-1">
                    <div>{specialNotes}</div>
                  </td>
                </tr>
              )}
            </>
          )}
          <tr className="h-8">
            <td className="text-gr h5 py-1 pr-3 align-top w-24">성격</td>
            <td className="text-sm py-1">
              <div>{description}</div>
            </td>
          </tr>
          <tr className="h-8">
            <td className="text-gr h5 py-1 pr-3 align-top w-24">발견장소</td>
            <td className="text-sm py-1">
              <div>{foundLocation}</div>
            </td>
          </tr>
          <tr className="h-8 align-top">
            <td className="text-gr h5 py-1 pr-3 w-24">건강 기록</td>
            <td className="text-sm py-1">
              {healthNotes && healthNotes.length > 0 ? (
                <ul className="space-y-1">
                  {healthNotes.map((note, index) => (
                    <li key={index} className="flex items-start text-gray-700">
                      {note}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-gray-700">내용이 없습니다.</div>
              )}
            </td>
          </tr>
          {!isCenterSubscriber && (
            <tr className="h-8">
              <td className="text-gr h5 py-1 pr-3 align-top w-24">관할기관</td>
              <td className="text-sm py-1">
                <div>{center}</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
